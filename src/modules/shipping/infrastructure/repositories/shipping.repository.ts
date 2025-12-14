import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { IShippingRepository } from '@modules/shipping/domain/repositories/shipping.repository.interface';
import { Shipping, ShippingHistory, ShippingStatus } from '@modules/shipping/domain/entities/shipping.entity';

@Injectable()
export class ShippingRepository implements IShippingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrderId(orderId: number): Promise<Shipping | null> {
    const shipping = await this.prisma.shipping.findUnique({
      where: { orderId },
    });

    if (!shipping) {
      return null;
    }

    return this.toDomainShipping(shipping);
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Shipping | null> {
    const shipping = await this.prisma.shipping.findUnique({
      where: { trackingNumber },
    });

    if (!shipping) {
      return null;
    }

    return this.toDomainShipping(shipping);
  }

  async create(data: {
    orderId: number;
    trackingNumber?: string;
    carrier?: string;
    status: ShippingStatus;
    currentLocation?: string;
    estimatedDelivery?: bigint;
  }): Promise<Shipping> {
    const now = BigInt(Date.now());
    const shipping = await this.prisma.shipping.create({
      data: {
        orderId: data.orderId,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        status: data.status,
        currentLocation: data.currentLocation,
        estimatedDelivery: data.estimatedDelivery,
        shippingMetadata: {},
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.toDomainShipping(shipping);
  }

  async update(id: number, data: Partial<Shipping>): Promise<Shipping> {
    const updateData: Record<string, unknown> = {
      updatedAt: BigInt(Date.now()),
    };

    if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber;
    if (data.carrier !== undefined) updateData.carrier = data.carrier;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.currentLocation !== undefined) updateData.currentLocation = data.currentLocation;
    if (data.estimatedDelivery !== undefined) updateData.estimatedDelivery = data.estimatedDelivery;

    const shipping = await this.prisma.shipping.update({
      where: { id },
      data: updateData,
    });

    return this.toDomainShipping(shipping);
  }

  async addHistory(data: {
    shippingId: number;
    status: string;
    location?: string;
    description?: string;
  }): Promise<ShippingHistory> {
    const history = await this.prisma.shippingHistory.create({
      data: {
        shippingId: data.shippingId,
        status: data.status,
        location: data.location,
        description: data.description,
        timestamp: BigInt(Date.now()),
        metadata: {},
      },
    });

    return this.toDomainShippingHistory(history);
  }

  async getHistory(shippingId: number): Promise<ShippingHistory[]> {
    const histories = await this.prisma.shippingHistory.findMany({
      where: { shippingId },
      orderBy: { timestamp: 'asc' },
    });

    return histories.map((h) => this.toDomainShippingHistory(h));
  }

  private toDomainShipping(shipping: {
    id: number;
    orderId: number;
    trackingNumber: string | null;
    carrier: string | null;
    status: string;
    currentLocation: string | null;
    estimatedDelivery: bigint | null;
    shippingMetadata: unknown;
    createdAt: bigint;
    updatedAt: bigint;
  }): Shipping {
    return {
      id: shipping.id,
      orderId: shipping.orderId,
      trackingNumber: shipping.trackingNumber || undefined,
      carrier: shipping.carrier || undefined,
      status: shipping.status as ShippingStatus,
      currentLocation: shipping.currentLocation || undefined,
      estimatedDelivery: shipping.estimatedDelivery || undefined,
      shippingMetadata: shipping.shippingMetadata as Record<string, unknown>,
      createdAt: shipping.createdAt,
      updatedAt: shipping.updatedAt,
    };
  }

  private toDomainShippingHistory(history: {
    id: number;
    shippingId: number;
    status: string;
    location: string | null;
    description: string | null;
    timestamp: bigint;
    metadata: unknown;
  }): ShippingHistory {
    return {
      id: history.id,
      shippingId: history.shippingId,
      status: history.status,
      location: history.location || undefined,
      description: history.description || undefined,
      timestamp: history.timestamp,
      metadata: history.metadata as Record<string, unknown>,
    };
  }
}


