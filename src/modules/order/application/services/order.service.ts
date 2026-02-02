import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { UploadService } from '@modules/upload/application/services/upload.service';
import { FILE_UPLOAD_PATHS } from '@common/constants/file.constants';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
  OrderWithRelations,
} from '@modules/order/domain/repositories/order.repository.interface';
import {
  ICartRepository,
  CART_REPOSITORY,
} from '@modules/cart/domain/repositories/cart.repository.interface';
import { NotificationService } from '@modules/notification/application/services/notification.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { CreateOrderFromCartDto } from '../dto/create-order-from-cart.dto';
import { QueryOrderDto } from '../dto/query-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Generate unique order number: ORD-YYYYMMDD-XXXXX
   */
  private async generateOrderNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ORD-${dateStr}-`;

    // Get last order number of today
    const lastOrder = await this.prisma.order.findFirst({
      where: {
        orderNo: {
          startsWith: prefix,
        },
      },
      orderBy: {
        orderNo: 'desc',
      },
      select: {
        orderNo: true,
      },
    });

    let sequence = 1;
    if (lastOrder?.orderNo) {
      const lastSequence = parseInt(lastOrder.orderNo.split('-').pop() || '0', 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(5, '0')}`;
  }

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
        seller: true,
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Filter items by seller
    const sellerItems = cartItems.filter((item) => {
      const product = productMap.get(item.productId);
      return product && product.sellerId === createOrderDto.sellerId;
    });

    if (sellerItems.length === 0) {
      throw new BadRequestException({
        message: MESSAGES.ORDER.NO_ITEMS_FOR_SELLER,
        errorCode: ERROR_CODES.ORDER_NO_ITEMS_FOR_SELLER,
      });
    }

    // Verify seller exists and is active
    const seller = await this.prisma.user.findUnique({
      where: { id: createOrderDto.sellerId },
    });

    if (!seller || !seller.isSeller) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.SELLER_NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_SELLER_NOT_FOUND,
      });
    }

    for (const cartItem of sellerItems) {
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

      for (const cartItem of sellerItems) {
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

      // Generate unique order number
      const orderNo = await this.generateOrderNo();

      const order = await this.orderRepository.create({
        orderNo,
        buyerId: userId,
        sellerId: createOrderDto.sellerId,
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

      for (const cartItem of sellerItems) {
        await this.cartRepository.removeCartItem(cartItem.id);
      }

      // Get buyer info for notification
      const buyer = await tx.user.findUnique({
        where: { id: userId },
        select: { fullName: true, email: true },
      });

      // Send notification to seller
      await this.sendNewOrderNotificationToSeller(
        createOrderDto.sellerId,
        order.id,
        buyer?.fullName || buyer?.email || 'Khách hàng',
        total,
        orderItems.length,
      );

      return await this.getOrderById(userId, order.id);
    });
  }

  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    // Verify seller exists and is active
    const seller = await this.prisma.user.findUnique({
      where: { id: createOrderDto.sellerId },
    });

    if (!seller || !seller.isSeller) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.SELLER_NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_SELLER_NOT_FOUND,
      });
    }

    const productIds = createOrderDto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        sellerId: createOrderDto.sellerId,
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

      // Generate unique order number
      const orderNo = await this.generateOrderNo();

      const order = await this.orderRepository.create({
        orderNo,
        buyerId: userId,
        sellerId: createOrderDto.sellerId,
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

      // Get buyer info for notification
      const buyer = await tx.user.findUnique({
        where: { id: userId },
        select: { fullName: true, email: true },
      });

      // Send notification to seller
      await this.sendNewOrderNotificationToSeller(
        createOrderDto.sellerId,
        order.id,
        buyer?.fullName || buyer?.email || 'Khách hàng',
        total,
        orderItems.length,
      );

      return await this.getOrderById(userId, order.id);
    });
  }

  async getOrders(userId: number, queryDto: QueryOrderDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;

    const result = await this.orderRepository.findByBuyerIdWithRelations(userId, {
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

    // Check authorization: user must be buyer, seller, or admin
    let isAuthorized = false;

    // Check if user is the buyer
    if (order.buyerId === userId) {
      isAuthorized = true;
    }

    // Check if user is the seller
    if (!isAuthorized && order.sellerId === userId) {
      isAuthorized = true;
    }

    // Check if user is admin
    if (!isAuthorized) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });
      const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');
      if (isAdmin) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
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

    if (order.buyerId !== userId) {
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
      orderNo: order.orderNo,
      buyerId: order.buyerId,
      sellerId: order.sellerId.toString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod || '',
      paymentImage: order.paymentImage || undefined,
      subtotal: Number(order.subtotal) || 0,
      tax: Number(order.tax) || 0,
      shipping: Number(order.shipping) || 0,
      discount: Number(order.discount) || 0,
      total: Number(order.total) || 0,
      currency: order.currency,
      shippingAddress: shippingAddress
        ? `${shippingAddress.street}, ${shippingAddress.ward || ''}, ${shippingAddress.district || ''}, ${shippingAddress.city}, ${shippingAddress.state}`
        : '',
      billingAddress: billingAddress
        ? `${billingAddress.street}, ${billingAddress.ward || ''}, ${billingAddress.district || ''}, ${billingAddress.city}, ${billingAddress.state}`
        : '',
      notes: order.notes || undefined,
      sellerName: order.seller?.sellerName || order.seller?.fullName,
      sellerLogo: order.seller?.sellerLogo || undefined,
      buyerEmail: order.buyer?.email,
      buyerName: order.buyer?.fullName || undefined,
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

  async getSellerOrders(sellerId: number, queryDto: QueryOrderDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;

    this.logger.log(`[getSellerOrders] Looking for orders with sellerId: ${sellerId}`);

    const result = await this.orderRepository.findBySellerIdWithRelations(sellerId, {
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
    const order = await this.orderRepository.findByIdWithRelations(orderId);
    if (!order) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_NOT_FOUND,
      });
    }

    // Check authorization: user must be buyer, seller, or admin
    let isAuthorized = false;

    // Check if user is the buyer
    if (order.buyerId === userId) {
      isAuthorized = true;
    }

    // Check if user is the seller
    if (!isAuthorized && order.sellerId === userId) {
      isAuthorized = true;
    }

    // Check if user is admin
    if (!isAuthorized) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });
      const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');
      if (isAdmin) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
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
    const order = await this.orderRepository.findByIdWithRelations(orderId);
    if (!order) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_NOT_FOUND,
      });
    }

    // Check authorization: user must be seller or admin
    let isAuthorized = false;

    // Check if user is the seller
    if (order.sellerId === userId) {
      isAuthorized = true;
    }

    // Check if user is admin
    if (!isAuthorized) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });
      const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');
      if (isAdmin) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
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

  async updatePaymentStatus(
    orderId: number,
    paymentStatus: string,
    userId: number,
    paymentProofUrl?: string,
  ) {
    const order = await this.orderRepository.findByIdWithRelations(orderId);
    if (!order) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_NOT_FOUND,
      });
    }

    // Check authorization: user must be buyer, seller, or admin
    let isAuthorized = false;

    // Check if user is the buyer
    if (order.buyerId === userId) {
      isAuthorized = true;
    }

    // Check if user is the seller
    if (!isAuthorized && order.sellerId === userId) {
      isAuthorized = true;
    }

    // Check if user is admin
    if (!isAuthorized) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });
      const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');
      if (isAdmin) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException({
        message: MESSAGES.ORDER.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.ORDER_UNAUTHORIZED_ACCESS,
      });
    }

    // Update payment status and payment image in single atomic operation
    await this.orderRepository.update(orderId, {
      paymentStatus,
      ...(paymentProofUrl && { paymentImage: paymentProofUrl }),
    });

    const updatedOrder = await this.orderRepository.findByIdWithRelations(orderId);
    return this.formatOrder(updatedOrder!);
  }

  /**
   * Upload payment proof image for an order
   * Authorized users: buyer, seller, or admin
   */
  async uploadPaymentImage(orderId: number, file: Express.Multer.File, userId: number) {
    const order = await this.orderRepository.findByIdWithRelations(orderId);
    if (!order) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_NOT_FOUND,
      });
    }

    // Check authorization: user must be buyer, seller, or admin
    let isAuthorized = false;

    // Check if user is the buyer
    if (order.buyerId === userId) {
      isAuthorized = true;
    }

    // Check if user is the seller
    if (!isAuthorized && order.sellerId === userId) {
      isAuthorized = true;
    }

    // Check if user is admin
    if (!isAuthorized) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });
      const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');
      if (isAdmin) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException({
        message: MESSAGES.ORDER.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.ORDER_UNAUTHORIZED_ACCESS,
      });
    }

    // Upload image to storage
    const uploadResult = await this.uploadService.uploadFile(
      file,
      FILE_UPLOAD_PATHS.PAYMENTS,
      `order-${orderId}`,
      true, // imageOnly
    );

    // Update order with payment image URL
    await this.orderRepository.update(orderId, {
      paymentImage: uploadResult.url,
    });

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

    if (order.buyerId !== userId) {
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

  async getOrderStats(buyerId?: number, sellerId?: number) {
    const where: Record<string, unknown> = {};

    if (buyerId) {
      where.buyerId = buyerId;
    }

    if (sellerId) {
      where.sellerId = sellerId;
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

  /**
   * Send notification to seller when new order is placed
   */
  private async sendNewOrderNotificationToSeller(
    sellerId: number,
    orderId: number,
    buyerName: string,
    total: number,
    itemCount: number,
  ) {
    try {
      const formattedTotal = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(total);

      await this.notificationService.createAndEmitNotification({
        userId: sellerId,
        type: 'order',
        title: 'Đơn hàng mới',
        message: `${buyerName} vừa đặt ${itemCount} sản phẩm với tổng giá trị ${formattedTotal}`,
        actionUrl: `/seller/orders/${orderId}`,
        metadata: {
          orderId,
          buyerName,
          total,
          itemCount,
        },
      });

      this.logger.log(`Sent new order notification to seller ${sellerId} for order ${orderId}`);
    } catch (error) {
      // Log error but don't fail the order creation
      this.logger.error(`Failed to send notification to seller ${sellerId}:`, error);
    }
  }
}
