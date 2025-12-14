import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import {
  IShippingRepository,
  SHIPPING_REPOSITORY,
} from '@modules/shipping/domain/repositories/shipping.repository.interface';
import { UpdateShippingStatusDto } from '../dto/update-shipping-status.dto';
import { ShippingStatus } from '@modules/shipping/domain/entities/shipping.entity';

@Injectable()
export class ShippingService {
  constructor(
    @Inject(SHIPPING_REPOSITORY)
    private readonly shippingRepository: IShippingRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getShippingInfo(orderId: number) {
    let shipping = await this.shippingRepository.findByOrderId(orderId);

    if (!shipping) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException({
          message: MESSAGES.ORDER.NOT_FOUND,
          errorCode: ERROR_CODES.ORDER_NOT_FOUND,
        });
      }

      shipping = await this.shippingRepository.create({
        orderId,
        status: ShippingStatus.PENDING,
      });
    }

    const history = await this.shippingRepository.getHistory(shipping.id);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
      },
    });

    const address = order?.shippingAddress ? {
      recipientName: order.shippingAddress.recipientName,
      recipientPhone: order.shippingAddress.recipientPhone,
      street: order.shippingAddress.street,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      district: order.shippingAddress.district ?? undefined,
      ward: order.shippingAddress.ward ?? undefined,
    } : undefined;
    return this.formatShippingInfo(shipping, history, address);
  }

  async getShippingHistory(orderId: number) {
    const shipping = await this.shippingRepository.findByOrderId(orderId);
    if (!shipping) {
      throw new NotFoundException({
        message: 'Shipping not found',
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    const history = await this.shippingRepository.getHistory(shipping.id);
    return history.map((h) => ({
      id: h.id.toString(),
      orderId: shipping.orderId.toString(),
      status: h.status,
      location: h.location,
      timestamp: new Date(Number(h.timestamp)).toISOString(),
      description: h.description,
      carrier: shipping.carrier || 'Unknown',
    }));
  }

  async updateShippingStatus(orderId: number, updateDto: UpdateShippingStatusDto) {
    let shipping = await this.shippingRepository.findByOrderId(orderId);

    if (!shipping) {
      shipping = await this.shippingRepository.create({
        orderId,
        status: updateDto.status,
        currentLocation: updateDto.currentLocation,
      });
    } else {
      shipping = await this.shippingRepository.update(shipping.id, {
        status: updateDto.status,
        currentLocation: updateDto.currentLocation,
      });
    }

    await this.shippingRepository.addHistory({
      shippingId: shipping.id,
      status: updateDto.status,
      location: updateDto.currentLocation,
      description: updateDto.description,
    });

    const history = await this.shippingRepository.getHistory(shipping.id);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
      },
    });

    const address = order?.shippingAddress ? {
      recipientName: order.shippingAddress.recipientName,
      recipientPhone: order.shippingAddress.recipientPhone,
      street: order.shippingAddress.street,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      district: order.shippingAddress.district ?? undefined,
      ward: order.shippingAddress.ward ?? undefined,
    } : undefined;
    return this.formatShippingInfo(shipping, history, address);
  }

  async trackPackage(trackingNumber: string) {
    const shipping = await this.shippingRepository.findByTrackingNumber(trackingNumber);
    if (!shipping) {
      throw new NotFoundException({
        message: 'Shipping not found',
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    const history = await this.shippingRepository.getHistory(shipping.id);
    const order = await this.prisma.order.findUnique({
      where: { id: shipping.orderId },
      include: {
        shippingAddress: true,
      },
    });

    const address = order?.shippingAddress ? {
      recipientName: order.shippingAddress.recipientName,
      recipientPhone: order.shippingAddress.recipientPhone,
      street: order.shippingAddress.street,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      district: order.shippingAddress.district ?? undefined,
      ward: order.shippingAddress.ward ?? undefined,
    } : undefined;
    return this.formatShippingInfo(shipping, history, address);
  }

  private formatShippingInfo(
    shipping: {
      id: number;
      orderId: number;
      trackingNumber?: string;
      carrier?: string;
      status: ShippingStatus;
      currentLocation?: string;
      estimatedDelivery?: bigint;
    },
    history: Array<{
      id: number;
      status: string;
      location?: string;
      description?: string;
      timestamp: bigint;
    }>,
    address?: {
      recipientName: string;
      recipientPhone: string;
      street: string;
      city: string;
      state: string;
      district?: string;
      ward?: string;
    } | null,
  ) {
    const statusMap: Record<string, string> = {
      pending: 'processing',
      picked_up: 'shipped',
      in_transit: 'in_transit',
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered',
    };

    const steps = this.generateSteps(shipping.status, history);

    return {
      orderId: shipping.orderId.toString(),
      trackingNumber: shipping.trackingNumber || '',
      carrier: shipping.carrier || 'Unknown',
      status: statusMap[shipping.status] || shipping.status,
      currentLocation: shipping.currentLocation || 'Unknown',
      estimatedDelivery: shipping.estimatedDelivery
        ? new Date(Number(shipping.estimatedDelivery)).toISOString()
        : undefined,
      steps,
      deliveryAddress: address
        ? {
            recipient: address.recipientName,
            phone: address.recipientPhone,
            address: address.street,
            city: address.city,
            district: address.district || '',
            ward: address.ward || '',
          }
        : undefined,
    };
  }

  private generateSteps(
    currentStatus: ShippingStatus,
    history: Array<{
      status: string;
      location?: string;
      description?: string;
      timestamp: bigint;
    }>,
  ) {
    const statusOrder = [
      ShippingStatus.PENDING,
      ShippingStatus.PICKED_UP,
      ShippingStatus.IN_TRANSIT,
      ShippingStatus.OUT_FOR_DELIVERY,
      ShippingStatus.DELIVERED,
    ];

    const currentIndex = statusOrder.indexOf(currentStatus);

    return statusOrder.map((status, index) => {
      const historyItem = history.find((h) => h.status === status);
      const stepStatus =
        index < currentIndex
          ? 'completed'
          : index === currentIndex
            ? 'current'
            : 'pending';

      return {
        id: index.toString(),
        status: stepStatus,
        title: this.getStatusTitle(status),
        description: historyItem?.description || this.getStatusDescription(status),
        timestamp: historyItem
          ? new Date(Number(historyItem.timestamp)).toISOString()
          : new Date().toISOString(),
        location: historyItem?.location,
      };
    });
  }

  private getStatusTitle(status: ShippingStatus): string {
    const titles: Record<ShippingStatus, string> = {
      [ShippingStatus.PENDING]: 'Order Placed',
      [ShippingStatus.PICKED_UP]: 'Picked Up',
      [ShippingStatus.IN_TRANSIT]: 'In Transit',
      [ShippingStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
      [ShippingStatus.DELIVERED]: 'Delivered',
    };
    return titles[status] || status;
  }

  private getStatusDescription(status: ShippingStatus): string {
    const descriptions: Record<ShippingStatus, string> = {
      [ShippingStatus.PENDING]: 'Your order has been placed',
      [ShippingStatus.PICKED_UP]: 'Package has been picked up',
      [ShippingStatus.IN_TRANSIT]: 'Package is in transit',
      [ShippingStatus.OUT_FOR_DELIVERY]: 'Package is out for delivery',
      [ShippingStatus.DELIVERED]: 'Package has been delivered',
    };
    return descriptions[status] || '';
  }
}


