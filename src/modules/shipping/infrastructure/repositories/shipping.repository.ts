import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { Shipping, ShippingHistory, ShippingStatus } from '@prisma/client';
import {
  IShippingRepository,
  ShippingWithHistory,
  CreateShippingData,
  UpdateShippingData,
  CreateHistoryData,
} from '@modules/shipping/domain/repositories/shipping.repository.interface';

@Injectable()
export class ShippingRepository implements IShippingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrderId(orderId: number): Promise<ShippingWithHistory | null> {
    return await this.prisma.shipping.findUnique({
      where: { orderId },
      include: {
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  }

  async findByTrackingNumber(trackingNumber: string): Promise<ShippingWithHistory | null> {
    return await this.prisma.shipping.findUnique({
      where: { trackingNumber },
      include: {
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  }

  async create(data: CreateShippingData): Promise<Shipping> {
    const now = BigInt(Date.now());
    return await this.prisma.shipping.create({
      data: {
        orderId: data.orderId,
        trackingNumber: data.trackingNumber || null,
        carrier: data.carrier || null,
        status: data.status || ShippingStatus.pending,
        currentLocation: data.currentLocation || null,
        estimatedDelivery: data.estimatedDelivery || null,
        shippingMetadata: {},
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async update(id: number, data: UpdateShippingData): Promise<Shipping> {
    return await this.prisma.shipping.update({
      where: { id },
      data: {
        ...data,
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  async addHistory(shippingId: number, data: CreateHistoryData): Promise<ShippingHistory> {
    return await this.prisma.shippingHistory.create({
      data: {
        shippingId,
        status: data.status,
        location: data.location || null,
        description: data.description || null,
        timestamp: data.timestamp,
        metadata: {},
      },
    });
  }

  async getHistory(shippingId: number): Promise<ShippingHistory[]> {
    return await this.prisma.shippingHistory.findMany({
      where: { shippingId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
