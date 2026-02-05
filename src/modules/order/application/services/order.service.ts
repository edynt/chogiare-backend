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
import { ORDER_STATUS, PAYMENT_STATUS, PRODUCT_STATUS } from '@common/constants/enum.constants';

// String mappings for API responses (number -> string)
const ORDER_STATUS_STRINGS: Record<number, string> = {
  [ORDER_STATUS.PENDING]: 'pending',
  [ORDER_STATUS.CONFIRMED]: 'confirmed',
  [ORDER_STATUS.PREPARING]: 'preparing',
  [ORDER_STATUS.READY_FOR_PICKUP]: 'ready',
  [ORDER_STATUS.COMPLETED]: 'completed',
  [ORDER_STATUS.CANCELLED]: 'cancelled',
  6: 'refunded', // ORDER_STATUS.REFUNDED
};

const PAYMENT_STATUS_STRINGS: Record<number, string> = {
  [PAYMENT_STATUS.PENDING]: 'pending',
  [PAYMENT_STATUS.COMPLETED]: 'completed',
  [PAYMENT_STATUS.FAILED]: 'failed',
  [PAYMENT_STATUS.REFUNDED]: 'refunded',
};

// Reverse mappings for API requests (string -> number)
const ORDER_STATUS_FROM_STRING: Record<string, number> = {
  pending: ORDER_STATUS.PENDING,
  confirmed: ORDER_STATUS.CONFIRMED,
  preparing: ORDER_STATUS.PREPARING,
  ready: ORDER_STATUS.READY_FOR_PICKUP,
  ready_for_pickup: ORDER_STATUS.READY_FOR_PICKUP, // Alias
  completed: ORDER_STATUS.COMPLETED,
  cancelled: ORDER_STATUS.CANCELLED,
  refunded: 6, // ORDER_STATUS.REFUNDED
};

const PAYMENT_STATUS_FROM_STRING: Record<string, number> = {
  pending: PAYMENT_STATUS.PENDING,
  completed: PAYMENT_STATUS.COMPLETED,
  paid: PAYMENT_STATUS.COMPLETED, // Alias
  failed: PAYMENT_STATUS.FAILED,
  refunded: PAYMENT_STATUS.REFUNDED,
};

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

    // Verify seller exists
    const seller = await this.prisma.user.findUnique({
      where: { id: createOrderDto.sellerId },
    });

    if (!seller) {
      throw new NotFoundException({
        message: MESSAGES.ORDER.SELLER_NOT_FOUND,
        errorCode: ERROR_CODES.ORDER_SELLER_NOT_FOUND,
      });
    }

    for (const cartItem of sellerItems) {
      const product = productMap.get(cartItem.productId);
      if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
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
        status: ORDER_STATUS.PENDING,
        paymentStatus: PAYMENT_STATUS.PENDING,
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
    // Verify seller exists
    const seller = await this.prisma.user.findUnique({
      where: { id: createOrderDto.sellerId },
    });

    if (!seller) {
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
      if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
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
        status: ORDER_STATUS.PENDING,
        paymentStatus: PAYMENT_STATUS.PENDING,
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

    if (order.status !== ORDER_STATUS.PENDING) {
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

      await this.orderRepository.updateStatus(orderId, ORDER_STATUS.CANCELLED);

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
      status: ORDER_STATUS_STRINGS[order.status] || 'pending',
      paymentStatus: PAYMENT_STATUS_STRINGS[order.paymentStatus] || 'pending',
      paymentMethod: order.paymentMethod || '',
      paymentProofUrl: order.paymentImage || undefined,
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
      // Buyer info - use both naming conventions for compatibility
      buyerEmail: order.buyer?.email,
      buyerName: order.buyer?.fullName || undefined,
      userEmail: order.buyer?.email, // Alias for frontend compatibility
      userName: order.buyer?.fullName || undefined, // Alias for frontend compatibility
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

  async updateOrderStatus(orderId: number, status: string | number, userId: number) {
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

    // Convert string status to number using mapping
    let statusNum: number;
    if (typeof status === 'string') {
      // First try to use mapping, fallback to parseInt for numeric strings
      statusNum = ORDER_STATUS_FROM_STRING[status.toLowerCase()] ?? parseInt(status, 10);
    } else {
      statusNum = status;
    }

    // Validate statusNum is a valid number
    if (isNaN(statusNum)) {
      throw new BadRequestException({
        message: `Invalid order status: ${status}`,
        errorCode: 'INVALID_ORDER_STATUS',
      });
    }

    await this.orderRepository.updateStatus(orderId, statusNum);
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
      status: ORDER_STATUS.CONFIRMED,
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
    // Convert string status to number using mapping
    let paymentStatusNum: number;
    if (typeof paymentStatus === 'string') {
      // First try to use mapping, fallback to parseInt for numeric strings
      paymentStatusNum = PAYMENT_STATUS_FROM_STRING[paymentStatus.toLowerCase()] ?? parseInt(paymentStatus, 10);
    } else {
      paymentStatusNum = paymentStatus;
    }

    // Validate paymentStatusNum is a valid number
    if (isNaN(paymentStatusNum)) {
      throw new BadRequestException({
        message: `Invalid payment status: ${paymentStatus}`,
        errorCode: 'INVALID_PAYMENT_STATUS',
      });
    }

    await this.orderRepository.update(orderId, {
      paymentStatus: paymentStatusNum,
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

    const updateData: Record<string, unknown> = {};
    if (updateOrderDto.status !== undefined) updateData.status = updateOrderDto.status;
    if (updateOrderDto.paymentStatus !== undefined) updateData.paymentStatus = updateOrderDto.paymentStatus;
    if (updateOrderDto.paymentMethod !== undefined) updateData.paymentMethod = updateOrderDto.paymentMethod;
    if (updateOrderDto.shippingAddressId !== undefined) updateData.shippingAddressId = updateOrderDto.shippingAddressId;
    if (updateOrderDto.billingAddressId !== undefined) updateData.billingAddressId = updateOrderDto.billingAddressId;
    if (updateOrderDto.notes !== undefined) updateData.notes = updateOrderDto.notes;

    await this.orderRepository.update(orderId, updateData);

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
    const pendingOrders = orders.filter((o) => o.status === ORDER_STATUS.PENDING).length;
    const processingOrders = orders.filter((o) => o.status === ORDER_STATUS.CONFIRMED).length;
    const shippedOrders = orders.filter((o) => o.status === ORDER_STATUS.READY_FOR_PICKUP).length;
    const deliveredOrders = orders.filter((o) => o.status === ORDER_STATUS.COMPLETED).length;
    const cancelledOrders = orders.filter((o) => o.status === ORDER_STATUS.CANCELLED).length;

    const totalRevenue = orders
      .filter(
        (o) => o.status === ORDER_STATUS.COMPLETED && o.paymentStatus === PAYMENT_STATUS.COMPLETED,
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
