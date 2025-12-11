import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '@modules/order/domain/repositories/order.repository.interface';
import {
  ICartRepository,
  CART_REPOSITORY,
} from '@modules/cart/domain/repositories/cart.repository.interface';
import { CreateOrderDto } from '../dto/create-order.dto';
import { CreateOrderFromCartDto } from '../dto/create-order-from-cart.dto';
import { QueryOrderDto } from '../dto/query-order.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createOrderFromCart(userId: number, createOrderDto: CreateOrderFromCartDto) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException({
        message: MESSAGES.CART.NOT_FOUND,
        errorCode: ERROR_CODES.CART_NOT_FOUND,
      });
    }

    const cartItems = await this.cartRepository.findCartItemsByCartId(cart.id);
    if (cartItems.length === 0) {
      throw new BadRequestException({
        message: MESSAGES.ORDER.CART_EMPTY,
        errorCode: ERROR_CODES.ORDER_CART_EMPTY,
      });
    }

    const productIds = cartItems.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        store: true,
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const storeItems = cartItems.filter((item) => {
      const product = productMap.get(item.productId);
      return product && product.storeId === createOrderDto.storeId;
    });

    if (storeItems.length === 0) {
      throw new BadRequestException({
        message: MESSAGES.ORDER.NO_ITEMS_FOR_STORE,
        errorCode: ERROR_CODES.ORDER_NO_ITEMS_FOR_STORE,
      });
    }

    const store = await this.prisma.store.findUnique({
      where: { id: createOrderDto.storeId },
    });

    if (!store) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.STORE_NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_STORE_NOT_FOUND,
      });
    }

    for (const cartItem of storeItems) {
      const product = productMap.get(cartItem.productId);
      if (!product || product.status !== 'active') {
        throw new BadRequestException({
          message: MESSAGES.ORDER.PRODUCT_NOT_AVAILABLE,
          errorCode: ERROR_CODES.ORDER_PRODUCT_NOT_AVAILABLE,
        });
      }

      if (product.availableStock < cartItem.quantity) {
        throw new BadRequestException({
          message: MESSAGES.ORDER.INSUFFICIENT_STOCK,
          errorCode: ERROR_CODES.ORDER_INSUFFICIENT_STOCK,
        });
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItems = [];

      for (const cartItem of storeItems) {
        const product = productMap.get(cartItem.productId);
        if (!product) continue;

        const price = product.sellingPrice ? Number(product.sellingPrice) : Number(product.price);
        const itemSubtotal = price * cartItem.quantity;
        subtotal += itemSubtotal;

        await tx.product.update({
          where: { id: product.id },
          data: {
            reservedStock: {
              increment: cartItem.quantity,
            },
            availableStock: {
              decrement: cartItem.quantity,
            },
          },
        });

        orderItems.push({
          productId: product.id,
          productName: product.title,
          productImage: product.images[0]?.imageUrl || null,
          price,
          quantity: cartItem.quantity,
          subtotal: itemSubtotal,
        });
      }

      const tax = 0;
      const shipping = 0;
      const discount = 0;
      const total = subtotal + tax + shipping - discount;

      const order = await this.orderRepository.create({
        userId,
        storeId: createOrderDto.storeId,
        status: OrderStatus.pending,
        paymentStatus: PaymentStatus.pending,
        paymentMethod: createOrderDto.paymentMethod || null,
        subtotal,
        tax,
        shipping,
        discount,
        total,
        currency: 'VND',
        shippingAddressId: createOrderDto.shippingAddressId || null,
        billingAddressId: createOrderDto.billingAddressId || null,
        notes: createOrderDto.notes || null,
        sellerNotes: null,
        orderMetadata: {},
      });

      for (const item of orderItems) {
        await this.orderRepository.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          itemMetadata: {},
        });
      }

      for (const cartItem of storeItems) {
        await this.cartRepository.removeCartItem(cartItem.id);
      }

      return await this.getOrderById(userId, order.id);
    });
  }

  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: createOrderDto.storeId },
    });

    if (!store) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.STORE_NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_STORE_NOT_FOUND,
      });
    }

    const productIds = createOrderDto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        storeId: createOrderDto.storeId,
      },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of createOrderDto.items) {
      const product = productMap.get(item.productId);
      if (!product || product.status !== 'active') {
        throw new BadRequestException({
          message: MESSAGES.ORDER.PRODUCT_NOT_AVAILABLE,
          errorCode: ERROR_CODES.ORDER_PRODUCT_NOT_AVAILABLE,
        });
      }

      if (product.availableStock < item.quantity) {
        throw new BadRequestException({
          message: MESSAGES.ORDER.INSUFFICIENT_STOCK,
          errorCode: ERROR_CODES.ORDER_INSUFFICIENT_STOCK,
        });
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItems = [];

      for (const item of createOrderDto.items) {
        const product = productMap.get(item.productId);
        if (!product) continue;

        const price = product.sellingPrice ? Number(product.sellingPrice) : Number(product.price);
        const itemSubtotal = price * item.quantity;
        subtotal += itemSubtotal;

        await tx.product.update({
          where: { id: product.id },
          data: {
            reservedStock: {
              increment: item.quantity,
            },
            availableStock: {
              decrement: item.quantity,
            },
          },
        });

        orderItems.push({
          productId: product.id,
          productName: product.title,
          productImage: product.images[0]?.imageUrl || null,
          price,
          quantity: item.quantity,
          subtotal: itemSubtotal,
        });
      }

      const tax = 0;
      const shipping = 0;
      const discount = 0;
      const total = subtotal + tax + shipping - discount;

      const order = await this.orderRepository.create({
        userId,
        storeId: createOrderDto.storeId,
        status: OrderStatus.pending,
        paymentStatus: PaymentStatus.pending,
        paymentMethod: createOrderDto.paymentMethod || null,
        subtotal,
        tax,
        shipping,
        discount,
        total,
        currency: 'VND',
        shippingAddressId: createOrderDto.shippingAddressId || null,
        billingAddressId: createOrderDto.billingAddressId || null,
        notes: createOrderDto.notes || null,
        sellerNotes: null,
        orderMetadata: {},
      });

      for (const item of orderItems) {
        await this.orderRepository.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          itemMetadata: {},
        });
      }

      return await this.getOrderById(userId, order.id);
    });
  }

  async getOrders(userId: number, queryDto: QueryOrderDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;

    const result = await this.orderRepository.findByUserId(userId, {
      status: queryDto.status,
      paymentStatus: queryDto.paymentStatus,
      page,
      pageSize,
    });

    const orders = await Promise.all(
      result.items.map(async (order) => {
        return await this.enrichOrder(order);
      }),
    );

    return {
      items: orders,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async getOrderById(userId: number, orderId: number) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_NOT_FOUND,
      });
    }

    if (order.userId !== userId) {
      throw new ForbiddenException({
        message: MESSAGES.ORDER.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.ORDER_UNAUTHORIZED_ACCESS,
      });
    }

    return await this.enrichOrder(order);
  }

  async cancelOrder(userId: number, orderId: number) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_NOT_FOUND,
      });
    }

    if (order.userId !== userId) {
      throw new ForbiddenException({
        message: MESSAGES.ORDER.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.ORDER_UNAUTHORIZED_ACCESS,
      });
    }

    if (order.status !== OrderStatus.pending) {
      throw new BadRequestException({
        message: MESSAGES.ORDER.CANNOT_CANCEL,
        errorCode: ERROR_CODES.ORDER_CANNOT_CANCEL,
      });
    }

    return await this.prisma.$transaction(async (tx) => {
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: order.id },
      });

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            reservedStock: {
              decrement: item.quantity,
            },
            availableStock: {
              increment: item.quantity,
            },
          },
        });
      }

      const updatedOrder = await this.orderRepository.updateStatus(orderId, OrderStatus.cancelled);

      return await this.enrichOrder(updatedOrder);
    });
  }

  private async enrichOrder(order: {
    id: number;
    userId: number;
    storeId: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
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
    createdAt: bigint;
    updatedAt: bigint;
  }) {
    const [store, items, shippingAddress, billingAddress] = await Promise.all([
      this.prisma.store.findUnique({
        where: { id: order.storeId },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          isVerified: true,
        },
      }),
      this.prisma.orderItem.findMany({
        where: { orderId: order.id },
      }),
      order.shippingAddressId
        ? this.prisma.address.findUnique({
            where: { id: order.shippingAddressId },
          })
        : null,
      order.billingAddressId
        ? this.prisma.address.findUnique({
            where: { id: order.billingAddressId },
          })
        : null,
    ]);

    return {
      id: order.id,
      userId: order.userId,
      store: store
        ? {
            id: store.id,
            name: store.name,
            slug: store.slug,
            logo: store.logo,
            isVerified: store.isVerified,
          }
        : null,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      currency: order.currency,
      shippingAddress: shippingAddress
        ? {
            id: shippingAddress.id,
            recipientName: shippingAddress.recipientName,
            recipientPhone: shippingAddress.recipientPhone,
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            district: shippingAddress.district,
            ward: shippingAddress.ward,
            zipCode: shippingAddress.zipCode,
            country: shippingAddress.country,
          }
        : null,
      billingAddress: billingAddress
        ? {
            id: billingAddress.id,
            recipientName: billingAddress.recipientName,
            recipientPhone: billingAddress.recipientPhone,
            street: billingAddress.street,
            city: billingAddress.city,
            state: billingAddress.state,
            district: billingAddress.district,
            ward: billingAddress.ward,
            zipCode: billingAddress.zipCode,
            country: billingAddress.country,
          }
        : null,
      notes: order.notes,
      sellerNotes: order.sellerNotes,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        price: Number(item.price),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
      })),
      createdAt: order.createdAt.toString(),
      updatedAt: order.updatedAt.toString(),
    };
  }
}

