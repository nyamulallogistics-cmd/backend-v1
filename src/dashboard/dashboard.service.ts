import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentStatus, QuoteStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getCargoOwnerStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Active shipments (not delivered or cancelled)
    const activeShipments = await this.prisma.shipment.count({
      where: {
        cargoOwnerId: userId,
        status: { in: [ShipmentStatus.PENDING_PICKUP, ShipmentStatus.AWAITING_PICKUP, ShipmentStatus.IN_TRANSIT] },
      },
    });

    const awaitingPickup = await this.prisma.shipment.count({
      where: {
        cargoOwnerId: userId,
        status: { in: [ShipmentStatus.PENDING_PICKUP, ShipmentStatus.AWAITING_PICKUP] },
      },
    });

    // In transit shipments
    const inTransit = await this.prisma.shipment.count({
      where: {
        cargoOwnerId: userId,
        status: ShipmentStatus.IN_TRANSIT,
      },
    });

    // Total spent this month
    const monthlySpent = await this.prisma.shipment.aggregate({
      where: {
        cargoOwnerId: userId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: {
        amount: true,
      },
    });

    // Pending quotes
    const pendingQuotes = await this.prisma.quote.count({
      where: {
        cargoOwnerId: userId,
        status: QuoteStatus.ACTIVE,
        expiresAt: { gte: now },
      },
    });

    // Quotes expiring soon (within 3 days)
    const expiringDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const expiringSoon = await this.prisma.quote.count({
      where: {
        cargoOwnerId: userId,
        status: QuoteStatus.ACTIVE,
        expiresAt: { gte: now, lte: expiringDate },
      },
    });

    return {
      activeShipments: {
        value: activeShipments,
        awaitingPickup,
      },
      inTransit: {
        value: inTransit,
      },
      totalSpent: {
        value: monthlySpent._sum.amount || 0,
        period: 'This month',
      },
      pendingQuotes: {
        value: pendingQuotes,
        expiringSoon,
      },
    };
  }

  async getTransporterStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Active deliveries
    const activeDeliveries = await this.prisma.shipment.count({
      where: {
        transporterId: userId,
        status: { in: [ShipmentStatus.PENDING_PICKUP, ShipmentStatus.AWAITING_PICKUP, ShipmentStatus.IN_TRANSIT] },
      },
    });

    const pendingPickup = await this.prisma.shipment.count({
      where: {
        transporterId: userId,
        status: { in: [ShipmentStatus.PENDING_PICKUP, ShipmentStatus.AWAITING_PICKUP] },
      },
    });

    // Available loads (active quotes they haven't bid on)
    const existingBids = await this.prisma.bid.findMany({
      where: { transporterId: userId },
      select: { quoteId: true },
    });

    const bidQuoteIds = existingBids.map(bid => bid.quoteId);

    const availableLoads = await this.prisma.quote.count({
      where: {
        status: QuoteStatus.ACTIVE,
        expiresAt: { gte: now },
        id: { notIn: bidQuoteIds },
      },
    });

    // Monthly earnings
    const monthlyEarnings = await this.prisma.shipment.aggregate({
      where: {
        transporterId: userId,
        status: ShipmentStatus.DELIVERED,
        deliveryDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: {
        amount: true,
      },
    });

    // Pending earnings (in transit)
    const pendingEarnings = await this.prisma.shipment.aggregate({
      where: {
        transporterId: userId,
        status: { in: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.PENDING_PICKUP, ShipmentStatus.AWAITING_PICKUP] },
      },
      _sum: {
        amount: true,
      },
    });

    // Completed trips (all time)
    const completedTrips = await this.prisma.shipment.count({
      where: {
        transporterId: userId,
        status: ShipmentStatus.DELIVERED,
      },
    });

    // Completed this month
    const completedThisMonth = await this.prisma.shipment.count({
      where: {
        transporterId: userId,
        status: ShipmentStatus.DELIVERED,
        deliveryDate: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    return {
      activeDeliveries: {
        value: activeDeliveries,
        pendingPickup,
      },
      availableLoads: {
        value: availableLoads,
      },
      monthlyEarnings: {
        value: monthlyEarnings._sum.amount || 0,
        pending: pendingEarnings._sum.amount || 0,
      },
      completedTrips: {
        value: completedTrips,
        thisMonth: completedThisMonth,
      },
    };
  }

  async getCargoOwnerDashboard(userId: string) {
    const stats = await this.getCargoOwnerStats(userId);

    // Get active shipments
    const activeShipments = await this.prisma.shipment.findMany({
      where: {
        cargoOwnerId: userId,
        status: { in: [ShipmentStatus.PENDING_PICKUP, ShipmentStatus.AWAITING_PICKUP, ShipmentStatus.IN_TRANSIT] },
      },
      include: {
        transporter: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get recent quotes with bids
    const recentQuotes = await this.prisma.quote.findMany({
      where: {
        cargoOwnerId: userId,
        status: QuoteStatus.ACTIVE,
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
      take: 5,
    });

    return {
      stats,
      activeShipments,
      recentQuotes,
    };
  }

  async getTransporterDashboard(userId: string) {
    const stats = await this.getTransporterStats(userId);

    // Get recent deliveries
    const recentDeliveries = await this.prisma.shipment.findMany({
      where: {
        transporterId: userId,
      },
      include: {
        cargoOwner: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get available loads (excluding those they've already bid on)
    const existingBids = await this.prisma.bid.findMany({
      where: { transporterId: userId },
      select: { quoteId: true },
    });

    const bidQuoteIds = existingBids.map(bid => bid.quoteId);

    const availableLoads = await this.prisma.quote.findMany({
      where: {
        status: QuoteStatus.ACTIVE,
        expiresAt: { gte: new Date() },
        id: { notIn: bidQuoteIds },
      },
      include: {
        cargoOwner: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
          },
        },
        bids: {
          select: {
            id: true,
            amount: true,
          },
          orderBy: { amount: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      stats,
      recentDeliveries,
      availableLoads,
    };
  }
}

