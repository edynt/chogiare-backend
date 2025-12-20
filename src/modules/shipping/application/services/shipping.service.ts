import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import {
  SHIPPING_REPOSITORY,
  IShippingRepository,
  ShippingWithHistory,
} from '@modules/shipping/domain/repositories/shipping.repository.interface';
import { UpdateShippingDto, AddShippingHistoryDto } from '../dto/update-shipping.dto';
import { Shipping, ShippingHistory } from '@prisma/client';

@Injectable()
export class ShippingService {
  constructor(
    @Inject(SHIPPING_REPOSITORY)
    private readonly shippingRepository: IShippingRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getShippingByOrderId(orderId: number, userId: number): Promise<ShippingWithHistory> {
    // Verify order ownership
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, storeId: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Check if user is order owner or store owner
    const store = await this.prisma.store.findUnique({
      where: { id: order.storeId },
      select: { userId: true },
    });

    if (order.userId !== userId && store?.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this shipping information');
    }

    const shipping = await this.shippingRepository.findByOrderId(orderId);

    if (!shipping) {
      throw new NotFoundException(`Shipping information for order ${orderId} not found`);
    }

    return shipping;
  }

  async getShippingHistory(orderId: number, userId: number): Promise<ShippingHistory[]> {
    const shipping = await this.getShippingByOrderId(orderId, userId);
    return await this.shippingRepository.getHistory(shipping.id);
  }

  async updateShipping(
    orderId: number,
    userId: number,
    updateDto: UpdateShippingDto,
  ): Promise<Shipping> {
    // Verify store ownership
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: { select: { userId: true } } },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.store.userId !== userId) {
      throw new ForbiddenException('Only the store owner can update shipping information');
    }

    let shipping = await this.shippingRepository.findByOrderId(orderId);

    if (!shipping) {
      // Create shipping record if it doesn't exist
      shipping = await this.shippingRepository.create({
        orderId,
        trackingNumber: updateDto.trackingNumber,
        carrier: updateDto.carrier,
        status: updateDto.status,
        currentLocation: updateDto.currentLocation,
        estimatedDelivery: updateDto.estimatedDelivery
          ? BigInt(updateDto.estimatedDelivery)
          : undefined,
      });
    } else {
      // Update existing shipping
      shipping = await this.shippingRepository.update(shipping.id, {
        trackingNumber: updateDto.trackingNumber,
        carrier: updateDto.carrier,
        status: updateDto.status,
        currentLocation: updateDto.currentLocation,
        estimatedDelivery: updateDto.estimatedDelivery
          ? BigInt(updateDto.estimatedDelivery)
          : undefined,
      });
    }

    return shipping;
  }

  async addShippingHistory(
    orderId: number,
    userId: number,
    historyDto: AddShippingHistoryDto,
  ): Promise<ShippingHistory> {
    // Verify store ownership
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: { select: { userId: true } } },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.store.userId !== userId) {
      throw new ForbiddenException('Only the store owner can add shipping history');
    }

    const shipping = await this.shippingRepository.findByOrderId(orderId);

    if (!shipping) {
      throw new NotFoundException(`Shipping information for order ${orderId} not found`);
    }

    return await this.shippingRepository.addHistory(shipping.id, {
      status: historyDto.status || 'update',
      location: historyDto.location,
      description: historyDto.description,
      timestamp: BigInt(Date.now()),
    });
  }

  async trackByTrackingNumber(trackingNumber: string): Promise<ShippingWithHistory> {
    const shipping = await this.shippingRepository.findByTrackingNumber(trackingNumber);

    if (!shipping) {
      throw new NotFoundException(`Shipping with tracking number ${trackingNumber} not found`);
    }

    return shipping;
  }
}
