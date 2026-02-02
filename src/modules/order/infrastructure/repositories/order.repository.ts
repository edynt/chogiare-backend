import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import {
  IOrderRepository,
  OrderWithRelations,
} from '@modules/order/domain/repositories/order.repository.interface';
import { Order } from '@modules/order/domain/entities/order.entity';
import { OrderItem } from '@modules/order/domain/entities/order-item.entity';
import { Prisma } from '@prisma/client';

const ORDER_INCLUDE_RELATIONS = {
  seller: {
    select: {
      id: true,
      email: true,
      fullName: true,
      sellerName: true,
      sellerSlug: true,
      sellerLogo: true,
      sellerIsVerified: true,
    },
  },
  items: true,
  shippingAddress: {
    select: {
      id: true,
      street: true,
      ward: true,
      district: true,
      city: true,
      state: true,
    },
  },
  billingAddress: {
    select: {
      id: true,
      street: true,
      ward: true,
      district: true,
      city: true,
      state: true,
    },
  },
  buyer: {
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  },
};

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    orderNo: string;
    buyerId: number;
    sellerId: number;
    status: number;
    paymentStatus: number;
    paymentMethod: number | null;
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    currency: string;
    shippingAddressId: number | null;
    billingAddressId: number | null;
    notes: string | null;
    sellerNotes: string | null;
    orderMetadata: Record<string, unknown>;
  }): Promise<Order> {
    const now = BigInt(Date.now());
    const order = await this.prisma.order.create({
      data: {
        orderNo: data.orderNo,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
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
        orderMetadata: data.orderMetadata as Prisma.InputJsonValue,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.toDomainOrder(order);
  }

  async findById(id: number): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return null;
    }

    return this.toDomainOrder(order);
  }

  async findByIdWithRelations(id: number): Promise<OrderWithRelations | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE_RELATIONS,
    });

    if (!order) {
      return null;
    }

    return this.toDomainOrderWithRelations(order);
  }

  async findByBuyerId(
    buyerId: number,
    options?: {
      status?: number;
      paymentStatus?: number;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: Order[]; total: number }> {
    const where: Prisma.OrderWhereInput = { buyerId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.paymentStatus) {
      where.paymentStatus = options.paymentStatus;
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => this.toDomainOrder(order)),
      total,
    };
  }

  async findByBuyerIdWithRelations(
    buyerId: number,
    options?: {
      status?: number;
      paymentStatus?: number;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: OrderWithRelations[]; total: number }> {
    const where: Prisma.OrderWhereInput = { buyerId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.paymentStatus) {
      where.paymentStatus = options.paymentStatus;
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: ORDER_INCLUDE_RELATIONS,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => this.toDomainOrderWithRelations(order)),
      total,
    };
  }

  async findBySellerId(
    sellerId: number,
    options?: {
      status?: number;
      paymentStatus?: number;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: Order[]; total: number }> {
    const where: Prisma.OrderWhereInput = { sellerId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.paymentStatus) {
      where.paymentStatus = options.paymentStatus;
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => this.toDomainOrder(order)),
      total,
    };
  }

  async findBySellerIdWithRelations(
    sellerId: number,
    options?: {
      status?: number;
      paymentStatus?: number;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: OrderWithRelations[]; total: number }> {
    const where: Prisma.OrderWhereInput = { sellerId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.paymentStatus) {
      where.paymentStatus = options.paymentStatus;
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: ORDER_INCLUDE_RELATIONS,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => this.toDomainOrderWithRelations(order)),
      total,
    };
  }

  async updateStatus(id: number, status: number): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        status: status,
        updatedAt: BigInt(Date.now()),
      },
    });

    return this.toDomainOrder(order);
  }

  async updatePaymentStatus(id: number, paymentStatus: number): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: paymentStatus,
        updatedAt: BigInt(Date.now()),
      },
    });

    return this.toDomainOrder(order);
  }

  async update(id: number, data: Partial<Order>): Promise<Order> {
    const updateData: Prisma.OrderUpdateInput = {
      updatedAt: BigInt(Date.now()),
    };

    if (data.status !== undefined) updateData.status = data.status;
    if (data.paymentStatus !== undefined)
      updateData.paymentStatus = data.paymentStatus;
    if (data.paymentMethod !== undefined)
      updateData.paymentMethod = data.paymentMethod;
    if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
    if (data.tax !== undefined) updateData.tax = data.tax;
    if (data.shipping !== undefined) updateData.shipping = data.shipping;
    if (data.discount !== undefined) updateData.discount = data.discount;
    if (data.total !== undefined) updateData.total = data.total;
    if (data.shippingAddressId !== undefined) {
      (updateData as { shippingAddressId?: number | null }).shippingAddressId =
        data.shippingAddressId || null;
    }
    if (data.billingAddressId !== undefined) {
      (updateData as { billingAddressId?: number | null }).billingAddressId =
        data.billingAddressId || null;
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.sellerNotes !== undefined) updateData.sellerNotes = data.sellerNotes;
    if (data.paymentImage !== undefined) updateData.paymentImage = data.paymentImage;

    const order = await this.prisma.order.update({
      where: { id },
      data: updateData,
    });

    return this.toDomainOrder(order);
  }

  async createOrderItem(data: {
    orderId: number;
    productId: number;
    productName: string;
    productImage: string | null;
    price: number;
    quantity: number;
    subtotal: number;
    itemMetadata: Record<string, unknown>;
  }): Promise<OrderItem> {
    const now = BigInt(Date.now());
    const orderItem = await this.prisma.orderItem.create({
      data: {
        orderId: data.orderId,
        productId: data.productId,
        productName: data.productName,
        productImage: data.productImage,
        price: data.price,
        quantity: data.quantity,
        subtotal: data.subtotal,
        itemMetadata: data.itemMetadata as Prisma.InputJsonValue,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.toDomainOrderItem(orderItem);
  }

  private toDomainOrder(order: {
    id: number;
    orderNo: string | null;
    buyerId: number;
    sellerId: number;
    status: number;
    paymentStatus: number;
    paymentMethod: number | null;
    subtotal: number | { toString(): string; toNumber(): number };
    tax: number | { toString(): string; toNumber(): number };
    shipping: number | { toString(): string; toNumber(): number };
    discount: number | { toString(): string; toNumber(): number };
    total: number | { toString(): string; toNumber(): number };
    currency: string;
    shippingAddressId: number | null;
    billingAddressId: number | null;
    notes: string | null;
    sellerNotes: string | null;
    paymentImage?: string | null;
    orderMetadata: Record<string, unknown> | unknown;
    createdAt: bigint;
    updatedAt: bigint;
  }): Order {
    return {
      id: order.id,
      orderNo: order.orderNo,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: typeof order.subtotal === 'number' ? order.subtotal : Number(order.subtotal),
      tax: typeof order.tax === 'number' ? order.tax : Number(order.tax),
      shipping: typeof order.shipping === 'number' ? order.shipping : Number(order.shipping),
      discount: typeof order.discount === 'number' ? order.discount : Number(order.discount),
      total: typeof order.total === 'number' ? order.total : Number(order.total),
      currency: order.currency,
      shippingAddressId: order.shippingAddressId,
      billingAddressId: order.billingAddressId,
      notes: order.notes,
      sellerNotes: order.sellerNotes,
      paymentImage: order.paymentImage ?? null,
      orderMetadata: order.orderMetadata as Record<string, unknown>,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private toDomainOrderItem(orderItem: {
    id: number;
    orderId: number;
    productId: number;
    productName: string;
    productImage: string | null;
    price: number | { toString(): string; toNumber(): number };
    quantity: number;
    subtotal: number | { toString(): string; toNumber(): number };
    itemMetadata: Record<string, unknown> | unknown;
    createdAt: bigint;
    updatedAt: bigint;
  }): OrderItem {
    return {
      id: orderItem.id,
      orderId: orderItem.orderId,
      productId: orderItem.productId,
      productName: orderItem.productName,
      productImage: orderItem.productImage,
      price: typeof orderItem.price === 'number' ? orderItem.price : Number(orderItem.price),
      quantity: orderItem.quantity,
      subtotal:
        typeof orderItem.subtotal === 'number' ? orderItem.subtotal : Number(orderItem.subtotal),
      itemMetadata: orderItem.itemMetadata as Record<string, unknown>,
      createdAt: orderItem.createdAt,
      updatedAt: orderItem.updatedAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomainOrderWithRelations(order: any): OrderWithRelations {
    const baseOrder = this.toDomainOrder(order);
    return {
      ...baseOrder,
      seller: {
        id: order.seller.id,
        email: order.seller.email,
        fullName: order.seller.fullName,
        sellerName: order.seller.sellerName,
        sellerSlug: order.seller.sellerSlug,
        sellerLogo: order.seller.sellerLogo,
        sellerIsVerified: order.seller.sellerIsVerified,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: order.items.map((item: any) => this.toDomainOrderItem(item)),
      shippingAddress: order.shippingAddress
        ? {
            id: order.shippingAddress.id,
            street: order.shippingAddress.street,
            ward: order.shippingAddress.ward,
            district: order.shippingAddress.district,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
          }
        : null,
      billingAddress: order.billingAddress
        ? {
            id: order.billingAddress.id,
            street: order.billingAddress.street,
            ward: order.billingAddress.ward,
            district: order.billingAddress.district,
            city: order.billingAddress.city,
            state: order.billingAddress.state,
          }
        : null,
      buyer: {
        id: order.buyer.id,
        email: order.buyer.email,
        fullName: order.buyer.fullName,
      },
    };
  }
}
