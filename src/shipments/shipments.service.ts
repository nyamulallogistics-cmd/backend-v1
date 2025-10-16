import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { ShipmentStatus } from '@prisma/client';

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createShipmentDto: CreateShipmentDto) {
    return this.prisma.shipment.create({
      data: {
        ...createShipmentDto,
        eta: new Date(createShipmentDto.eta),
        cargoOwnerId: userId,
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
          },
        },
      },
    });
  }

  async findAll(userId: string, userRole: string, filterDto?: any) {
    // ADMIN sees ALL shipments (no user filtering)
    let where: any = {};
    
    if (userRole === 'ADMIN') {
      // Admin can see everything, apply only filters (not user filtering)
      where = {};
    } else if (userRole === 'CARGO_OWNER') {
      where.cargoOwnerId = userId;
    } else if (userRole === 'TRANSPORTER') {
      where.transporterId = userId;
    }

    // Apply filters (for all roles including ADMIN)
    if (filterDto?.status) {
      where.status = filterDto.status;
    }
    if (filterDto?.fromLocation) {
      where.fromLocation = { contains: filterDto.fromLocation, mode: 'insensitive' };
    }
    if (filterDto?.toLocation) {
      where.toLocation = { contains: filterDto.toLocation, mode: 'insensitive' };
    }
    if (filterDto?.search) {
      where.OR = [
        { id: { contains: filterDto.search, mode: 'insensitive' } },
        { cargo: { contains: filterDto.search, mode: 'insensitive' } },
        { fromLocation: { contains: filterDto.search, mode: 'insensitive' } },
        { toLocation: { contains: filterDto.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.shipment.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const shipment = await this.prisma.shipment.findUnique({
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
        transporter: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            email: true,
            phoneNumber: true,
          },
        },
        quote: {
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
            },
          },
        },
        progressHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    // ADMIN can view any shipment
    if (userRole === 'ADMIN') {
      return shipment;
    }

    // Check authorization
    if (userRole === 'CARGO_OWNER' && shipment.cargoOwnerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (userRole === 'TRANSPORTER' && shipment.transporterId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return shipment;
  }

  async update(id: string, userId: string, userRole: string, updateShipmentDto: UpdateShipmentDto) {
    const shipment = await this.findOne(id, userId, userRole);

    // Cargo owners can update their own shipments
    // Transporters can update status and progress of their shipments
    if (userRole === 'TRANSPORTER' && shipment.transporterId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Extract fields that belong to ShipmentProgress, not Shipment
    const { location, notes, ...shipmentFields } = updateShipmentDto;
    
    const updateData: any = { ...shipmentFields };
    if (updateShipmentDto.eta) {
      updateData.eta = new Date(updateShipmentDto.eta);
    }
    if (updateShipmentDto.pickupDate) {
      updateData.pickupDate = new Date(updateShipmentDto.pickupDate);
    }
    if (updateShipmentDto.deliveryDate) {
      updateData.deliveryDate = new Date(updateShipmentDto.deliveryDate);
    }

    // Automatically set completedAt when status changes to DELIVERED
    if (updateShipmentDto.status === ShipmentStatus.DELIVERED && shipment.status !== ShipmentStatus.DELIVERED) {
      updateData.completedAt = new Date();
      updateData.progress = 100;
      if (!updateData.deliveryDate) {
        updateData.deliveryDate = new Date();
      }
    }

    // Update lastUpdateTime when lastUpdate is provided
    if (updateShipmentDto.lastUpdate) {
      updateData.lastUpdateTime = new Date();
    }

    // Use transaction to update shipment and create progress history entry
    return this.prisma.$transaction(async (tx) => {
      // Update the shipment
      const updatedShipment = await tx.shipment.update({
        where: { id },
        data: updateData,
        include: {
          cargoOwner: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              phoneNumber: true,
            },
          },
          transporter: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              phoneNumber: true,
            },
          },
        },
      });

      // Create progress history entry if location or notes are provided
      if (location || notes || updateShipmentDto.progress !== undefined) {
        await tx.shipmentProgress.create({
          data: {
            shipmentId: id,
            location: location,
            notes: notes,
            progress: updateShipmentDto.progress ?? updatedShipment.progress,
            status: updateShipmentDto.status ?? updatedShipment.status,
          },
        });
      }

      return updatedShipment;
    });
  }

  async getActiveShipments(userId: string, userRole: string) {
    let where: any = {
      status: { in: [ShipmentStatus.PENDING_PICKUP, ShipmentStatus.IN_TRANSIT] }
    };

    if (userRole === 'ADMIN') {
      // Admin sees all active shipments
      where = { status: { in: [ShipmentStatus.PENDING_PICKUP, ShipmentStatus.IN_TRANSIT] } };
    } else if (userRole === 'CARGO_OWNER') {
      where.cargoOwnerId = userId;
    } else if (userRole === 'TRANSPORTER') {
      where.transporterId = userId;
    }

    return this.prisma.shipment.findMany({
      where,
      include: {
        cargoOwner: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
          },
        },
        transporter: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async getCompletedShipments(userId: string, userRole: string) {
    let where: any = { status: ShipmentStatus.DELIVERED };

    if (userRole === 'ADMIN') {
      // Admin sees all completed shipments
      where = { status: ShipmentStatus.DELIVERED };
    } else if (userRole === 'CARGO_OWNER') {
      where.cargoOwnerId = userId;
    } else if (userRole === 'TRANSPORTER') {
      where.transporterId = userId;
    }

    return this.prisma.shipment.findMany({
      where,
      include: {
        cargoOwner: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            phoneNumber: true,
          },
        },
        transporter: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 50,
    });
  }

  async getShipmentStats(userId: string, userRole: string) {
    let where: any = {};

    if (userRole === 'ADMIN') {
      // Admin sees stats for ALL shipments
      where = {};
    } else if (userRole === 'CARGO_OWNER') {
      where.cargoOwnerId = userId;
    } else if (userRole === 'TRANSPORTER') {
      where.transporterId = userId;
    }

    const [active, inTransit, completed, totalValue] = await Promise.all([
      this.prisma.shipment.count({
        where: {
          ...where,
          status: { in: [ShipmentStatus.PENDING_PICKUP, ShipmentStatus.IN_TRANSIT] },
        },
      }),
      this.prisma.shipment.count({
        where: {
          ...where,
          status: ShipmentStatus.IN_TRANSIT,
        },
      }),
      this.prisma.shipment.count({
        where: {
          ...where,
          status: ShipmentStatus.DELIVERED,
        },
      }),
      this.prisma.shipment.aggregate({
        where,
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      active,
      inTransit,
      completed,
      totalValue: totalValue._sum.amount || 0,
    };
  }

  async getProgressHistory(id: string, userId: string, userRole: string) {
    // First verify the user has access to this shipment
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    // Check authorization
    if (userRole === 'CARGO_OWNER' && shipment.cargoOwnerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (userRole === 'TRANSPORTER' && shipment.transporterId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Get progress history
    return this.prisma.shipmentProgress.findMany({
      where: { shipmentId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, userId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.cargoOwnerId !== userId) {
      throw new ForbiddenException('Only the cargo owner can delete this shipment');
    }

    return this.prisma.shipment.delete({
      where: { id },
    });
  }
}

