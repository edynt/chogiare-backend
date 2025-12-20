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
  OrderWithRelations,
} from '@modules/order/domain/repositories/order.repository.interface';
import {
  ICartRepository,
  CART_REPOSITORY,
} from '@modules/cart/domain/repositories/cart.repository.interface';
import { CreateOrderDto } from '../dto/create-order.dto';
import { CreateOrderFromCartDto } from '../dto/create-order-from-cart.dto';
import { QueryOrderDto } from '../dto/query-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
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

    const result = await this.orderRepository.findByUserIdWithRelations(userId, {
      status: queryDto.status,
      paymentStatus: queryDto.paymentStatus,
      page,
      pageSize,
    });

    return {
      items: result.items.map((order) => this.formatOrder(order)),
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async getOrderById(userId: number, orderId: number) {
    const order = await this.orderRepository.findByIdWithRelations(orderId);
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

    return this.formatOrder(order);
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

      await this.orderRepository.updateStatus(orderId, OrderStatus.cancelled);

      const updatedOrder = await this.orderRepository.findByIdWithRelations(orderId);
      return this.formatOrder(updatedOrder!);
    });
  }

  private formatOrder(order: OrderWithRelations) {
    const shippingAddress = order.shippingAddress;
    const billingAddress = order.billingAddress;

    return {
      id: order.id.toString(),
      userId: order.userId,
      storeId: order.storeId.toString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod || '',
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      currency: order.currency,
      shippingAddress: shippingAddress
        ? `${shippingAddress.street}, ${shippingAddress.ward || ''}, ${shippingAddress.district || ''}, ${shippingAddress.city}, ${shippingAddress.state}`
        : '',
      billingAddress: billingAddress
        ? `${billingAddress.street}, ${billingAddress.ward || ''}, ${billingAddress.district || ''}, ${billingAddress.city}, ${billingAddress.state}`
        : '',
      notes: order.notes || undefined,
      storeName: order.store?.name,
      storeLogo: order.store?.logo || undefined,
      userEmail: order.user?.email,
      userName: order.user?.userInfo?.fullName || undefined,
      items: order.items.map((item) => ({
        id: item.id.toString(),
        orderId: order.id.toString(),
        productId: item.productId.toString(),
        productName: item.productName,
        productImage: item.productImage || '',
        price: Number(item.price),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
        createdAt: item.createdAt.toString(),
        updatedAt: item.updatedAt.toString(),
      })),
      createdAt: order.createdAt.toString(),
      updatedAt: order.updatedAt.toString(),
    };
  }

  async getStoreOrders(storeId: number, queryDto: QueryOrderDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;

    const result = await this.orderRepository.findByStoreIdWithRelations(storeId, {
      status: queryDto.status,
      paymentStatus: queryDto.paymentStatus,
      page,
      pageSize,
    });

    return {
      items: result.items.map((order) => this.formatOrder(order)),
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async updateOrderStatus(orderId: number, status: string, userId: number) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_NOT_FOUND,
      });
    }

    const store = await this.prisma.store.findUnique({
      where: { id: order.storeId },
    });

    if (!store) {
      throw new NotFoundException({
        message: MESSAGES.STORE.NOT_FOUND,
        errorCode: ERROR_CODES.STORE_NOT_FOUND || 'STORE_NOT_FOUND',
      });
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');

    if (order.userId !== userId && store.userId !== userId && !isAdmin) {
      throw new ForbiddenException({
        message: MESSAGES.ORDER.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.ORDER_UNAUTHORIZED_ACCESS,
      });
    }

    await this.orderRepository.updateStatus(orderId, status);
    const updatedOrder = await this.orderRepository.findByIdWithRelations(orderId);
    return this.formatOrder(updatedOrder!);
  }

  async confirmOrder(orderId: number, sellerNotes: string | undefined, userId: number) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_NOT_FOUND,
      });
    }

    const store = await this.prisma.store.findUnique({
      where: { id: order.storeId },
    });

    if (!store) {
      throw new NotFoundException({
        message: MESSAGES.STORE.NOT_FOUND,
        errorCode: ERROR_CODES.STORE_NOT_FOUND || 'STORE_NOT_FOUND',
      });
    }

    if (store.userId !== userId) {
      throw new ForbiddenException({
        message: MESSAGES.ORDER.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.ORDER_UNAUTHORIZED_ACCESS,
      });
    }

    await this.orderRepository.update(orderId, {
      status: OrderStatus.confirmed,
      sellerNotes: sellerNotes || null,
    });

    const updatedOrder = await this.orderRepository.findByIdWithRelations(orderId);
    return this.formatOrder(updatedOrder!);
  }

  async updatePaymentStatus(orderId: number, paymentStatus: string, userId: number) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_NOT_FOUND,
      });
    }

    const store = await this.prisma.store.findUnique({
      where: { id: order.storeId },
    });

    if (!store) {
      throw new NotFoundException({
        message: MESSAGES.STORE.NOT_FOUND,
        errorCode: ERROR_CODES.STORE_NOT_FOUND || 'STORE_NOT_FOUND',
      });
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');

    if (order.userId !== userId && store.userId !== userId && !isAdmin) {
      throw new ForbiddenException({
        message: MESSAGES.ORDER.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.ORDER_UNAUTHORIZED_ACCESS,
      });
    }

    await this.orderRepository.updatePaymentStatus(orderId, paymentStatus);
    const updatedOrder = await this.orderRepository.findByIdWithRelations(orderId);
    return this.formatOrder(updatedOrder!);
  }

  async updateOrder(orderId: number, updateOrderDto: UpdateOrderDto, userId: number) {
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

    await this.orderRepository.update(orderId, {
      status: updateOrderDto.status,
      paymentStatus: updateOrderDto.paymentStatus,
      paymentMethod: updateOrderDto.paymentMethod,
      shippingAddressId: updateOrderDto.shippingAddressId,
      billingAddressId: updateOrderDto.billingAddressId,
      notes: updateOrderDto.notes,
    });

    const updatedOrder = await this.orderRepository.findByIdWithRelations(orderId);
    return this.formatOrder(updatedOrder!);
  }

  async getOrderStats(userId?: number, storeId?: number) {
    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (storeId) {
      where.storeId = storeId;
    }

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        status: true,
        paymentStatus: true,
        total: true,
      },
    });

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === OrderStatus.pending).length;
    const processingOrders = orders.filter((o) => o.status === OrderStatus.confirmed).length;
    const shippedOrders = orders.filter((o) => o.status === OrderStatus.ready_for_pickup).length;
    const deliveredOrders = orders.filter((o) => o.status === OrderStatus.completed).length;
    const cancelledOrders = orders.filter((o) => o.status === OrderStatus.cancelled).length;

    const totalRevenue = orders
      .filter(
        (o) => o.status === OrderStatus.completed && o.paymentStatus === PaymentStatus.completed,
      )
      .reduce((sum, o) => sum + Number(o.total), 0);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    };
  }
}
