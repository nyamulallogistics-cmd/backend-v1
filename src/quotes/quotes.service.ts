import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateBidDto } from './dto/create-bid.dto';
import { QuoteStatus, ShipmentStatus } from '@prisma/client';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createQuoteDto: CreateQuoteDto) {
    // Validate userId
    if (!userId) {
      throw new BadRequestException('User ID is required. Please ensure you are authenticated.');
    }

    const data: any = {
      ...createQuoteDto,
      cargoOwnerId: userId,
    };

    // Handle date conversions
    if (createQuoteDto.pickupDate) {
      data.pickupDate = new Date(createQuoteDto.pickupDate);
    }
    if (createQuoteDto.deliveryDate) {
      data.deliveryDate = new Date(createQuoteDto.deliveryDate);
    }
    
    // Set expiration date (default to 7 days if not provided)
    if (createQuoteDto.expiresAt) {
      data.expiresAt = new Date(createQuoteDto.expiresAt);
    } else {
      data.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    // Calculate approximate distance if not provided (can be enhanced with actual geocoding)
    if (!data.distance) {
      data.distance = 0; // You can implement distance calculation here
    }

    return this.prisma.quote.create({
      data,
      include: {
        cargoOwner: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            email: true,
          },
        },
        bids: true,
      },
    });
  }

  async findAll(userId: string, userRole: string) {
    // Cargo owners see their own quotes
    if (userRole === 'CARGO_OWNER') {
      return this.prisma.quote.findMany({
        where: { cargoOwnerId: userId },
        include: {
          bids: {
            include: {
              transporter: {
                select: {
                  id: true,
                  fullName: true,
                  companyName: true,
                  email: true,
                },
              },
            },
          },
          cargoOwner: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Transporters see all active quotes
    return this.prisma.quote.findMany({
      where: {
        status: QuoteStatus.ACTIVE,
        expiresAt: { gte: new Date() },
      },
      include: {
        cargoOwner: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            email: true,
          },
        },
        bids: {
          where: { transporterId: userId },
          include: {
            transporter: {
              select: {
                id: true,
                fullName: true,
                companyName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        cargoOwner: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            email: true,
            phoneNumber: true,
          },
        },
        bids: {
          include: {
            transporter: {
              select: {
                id: true,
                fullName: true,
                companyName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
          orderBy: { amount: 'asc' },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    // Cargo owner can see their own quotes
    if (userRole === 'CARGO_OWNER' && quote.cargoOwnerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Transporters can see active quotes
    if (userRole === 'TRANSPORTER' && quote.status !== QuoteStatus.ACTIVE) {
      throw new ForbiddenException('This quote is no longer active');
    }

    return quote;
  }

  async getActiveQuotes(userId: string) {
    return this.prisma.quote.findMany({
      where: {
        cargoOwnerId: userId,
        status: QuoteStatus.ACTIVE,
        expiresAt: { gte: new Date() },
      },
      include: {
        bids: {
          include: {
            transporter: {
              select: {
                id: true,
                fullName: true,
                companyName: true,
              },
            },
          },
          orderBy: { amount: 'asc' },
        },
      },
      orderBy: { expiresAt: 'asc' },
      take: 10,
    });
  }

  async createBid(quoteId: string, userId: string, createBidDto: CreateBidDto) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { bids: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.status !== QuoteStatus.ACTIVE) {
      throw new BadRequestException('This quote is no longer active');
    }

    if (quote.expiresAt < new Date()) {
      throw new BadRequestException('This quote has expired');
    }

    // Check if transporter already bid
    const existingBid = quote.bids.find(bid => bid.transporterId === userId);
    if (existingBid) {
      throw new BadRequestException('You have already placed a bid on this quote');
    }

    return this.prisma.bid.create({
      data: {
        ...createBidDto,
        quoteId,
        transporterId: userId,
      },
      include: {
        transporter: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            email: true,
          },
        },
        quote: {
          include: {
            cargoOwner: {
              select: {
                id: true,
                fullName: true,
                companyName: true,
              },
            },
          },
        },
      },
    });
  }

  async acceptBid(quoteId: string, bidId: string, userId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        bids: true,
        shipment: true, // Check if shipment already exists
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.cargoOwnerId !== userId) {
      throw new ForbiddenException('Only the quote owner can accept bids');
    }

    // Check if a shipment already exists for this quote
    if (quote.shipment) {
      throw new BadRequestException('A shipment has already been created for this quote');
    }

    const bid = quote.bids.find(b => b.id === bidId);
    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    // Check if bid is already accepted
    if (bid.isAccepted) {
      throw new BadRequestException('This bid has already been accepted');
    }

    // Use a transaction to ensure all operations succeed or fail together
    return this.prisma.$transaction(async (tx) => {
      // Update bid as accepted
      await tx.bid.update({
        where: { id: bidId },
        data: { isAccepted: true },
      });

      // Update quote status
      await tx.quote.update({
        where: { id: quoteId },
        data: { status: QuoteStatus.ACCEPTED },
      });

      // Create shipment from the accepted bid with all quote details
      const shipment = await tx.shipment.create({
        data: {
          cargo: quote.cargo,
          cargoDescription: quote.cargoDescription,
          fromLocation: quote.fromLocation,
          fromAddress: quote.fromAddress,
          toLocation: quote.toLocation,
          toAddress: quote.toAddress,
          weight: quote.weight,
          distance: quote.distance,
          dimensions: quote.dimensions,
          amount: bid.amount,
          eta: quote.deliveryDate || new Date(Date.now() + bid.estimatedDays * 24 * 60 * 60 * 1000),
          pickupDate: quote.pickupDate,
          cargoOwnerId: quote.cargoOwnerId,
          transporterId: bid.transporterId,
          quoteId: quote.id,
          status: ShipmentStatus.PENDING_PICKUP,
        },
        include: {
          cargoOwner: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              email: true,
            },
          },
          transporter: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      return shipment;
    });
  }

  async getQuoteShipment(quoteId: string, userId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        shipment: {
          include: {
            cargoOwner: {
              select: {
                id: true,
                fullName: true,
                companyName: true,
                email: true,
              },
            },
            transporter: {
              select: {
                id: true,
                fullName: true,
                companyName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.cargoOwnerId !== userId) {
      throw new ForbiddenException('Only the quote owner can view this quote');
    }

    return quote.shipment;
  }

  async remove(id: string, userId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.cargoOwnerId !== userId) {
      throw new ForbiddenException('Only the quote owner can delete this quote');
    }

    return this.prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.CANCELLED },
    });
  }
}

