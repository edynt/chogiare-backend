import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/repositories/order.repository.interface';
import { Order, OrderStatus, PaymentStatus } from '../../domain/entities/order.entity';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return order ? this.toDomain(order) : null;
  }

  async findByUserId(
    userId: number,
    options?: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      skip?: number;
      take?: number;
    },
  ): Promise<Order[]> {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.paymentStatus) {
      where.paymentStatus = options.paymentStatus;
    }

    const orders = await this.prisma.order.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return orders.map((o) => this.toDomain(o));
  }

  async findByStoreId(
    storeId: number,
    options?: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      skip?: number;
      take?: number;
    },
  ): Promise<Order[]> {
    const where: any = { storeId };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.paymentStatus) {
      where.paymentStatus = options.paymentStatus;
    }

    const orders = await this.prisma.order.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return orders.map((o) => this.toDomain(o));
  }

  async create(
    data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Order> {
    const now = BigInt(Date.now());
    const order = await this.prisma.order.create({
      data: {
        userId: data.userId,
        storeId: data.storeId,
        status: data.status,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        subtotal: data.subtotal,
        tax: data.tax,
        shipping: data.shipping,
        discount: data.discount,
        total: data.total,
        currency: data.currency,
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.billingAddressId,
        notes: data.notes,
        sellerNotes: data.sellerNotes,
        createdAt: now,
        updatedAt: now,
      },
      include: {
        items: true,
      },
    });

    return this.toDomain(order);
  }

  async update(id: number, data: Partial<Order>): Promise<Order> {
    const now = BigInt(Date.now());
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        status: data.status,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        sellerNotes: data.sellerNotes,
        updatedAt: now,
      },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.toDomain(order);
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const now = BigInt(Date.now());
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        updatedAt: now,
      },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.toDomain(order);
  }

  async updatePaymentStatus(
    id: number,
    paymentStatus: PaymentStatus,
  ): Promise<Order> {
    const now = BigInt(Date.now());
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus,
        updatedAt: now,
      },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.toDomain(order);
  }

  async count(options?: {
    userId?: number;
    storeId?: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
  }): Promise<number> {
    const where: any = {};

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.storeId) {
      where.storeId = options.storeId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.paymentStatus) {
      where.paymentStatus = options.paymentStatus;
    }

    return this.prisma.order.count({ where });
  }

  toDomain(order: any): Order {
    return {
      id: order.id,
      userId: order.userId,
      storeId: order.storeId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal ? Number(order.subtotal) : 0,
      tax: order.tax ? Number(order.tax) : 0,
      shipping: order.shipping ? Number(order.shipping) : 0,
      discount: order.discount ? Number(order.discount) : 0,
      total: order.total ? Number(order.total) : 0,
      currency: order.currency,
      shippingAddressId: order.shippingAddressId,
      billingAddressId: order.billingAddressId,
      notes: order.notes,
      sellerNotes: order.sellerNotes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items
        ? order.items.map((item: any) => ({
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            price: item.price ? Number(item.price) : 0,
            quantity: item.quantity,
            subtotal: item.subtotal ? Number(item.subtotal) : 0,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }))
        : [],
    };
  }
}

