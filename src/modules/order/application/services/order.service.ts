import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/repositories/order.repository.interface';
import { Order, OrderStatus, PaymentStatus } from '../../domain/entities/order.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { QueryOrderDto } from '../dto/query-order.dto';
import { PrismaService } from '@common/database/prisma.service';
import { LoggerService } from '@common/logger/logger.service';
import { MESSAGES } from '@common/constants/messages.constants';

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async create(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    // Validate store
    const store = await this.prisma.store.findUnique({
      where: { id: createOrderDto.storeId },
    });
    if (!store) {
      throw new NotFoundException(MESSAGES.ORDER.STORE_NOT_FOUND);
    }

    // Validate addresses
    const shippingAddress = await this.prisma.address.findUnique({
      where: { id: createOrderDto.shippingAddressId },
    });
    if (!shippingAddress || shippingAddress.userId !== userId) {
      throw new NotFoundException(MESSAGES.ORDER.ADDRESS_NOT_FOUND);
    }

    if (createOrderDto.billingAddressId) {
      const billingAddress = await this.prisma.address.findUnique({
        where: { id: createOrderDto.billingAddressId },
      });
      if (!billingAddress || billingAddress.userId !== userId) {
        throw new NotFoundException(MESSAGES.ORDER.ADDRESS_NOT_FOUND);
      }
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems: Array<{
      productId: number;
      productName: string;
      productImage?: string;
      price: number;
      quantity: number;
      subtotal: number;
    }> = [];

    for (const item of createOrderDto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          images: {
            where: { displayOrder: 0 },
            take: 1,
          },
        },
      });

      if (!product) {
        throw new NotFoundException(MESSAGES.ORDER.NOT_FOUND);
      }

      if (product.status !== 'active' || !product.isActive) {
        throw new BadRequestException(MESSAGES.PRODUCT.NOT_AVAILABLE);
      }

      if (product.sellerId !== store.userId) {
        throw new BadRequestException(MESSAGES.PRODUCT.NOT_IN_STORE);
      }

      if (product.availableStock < item.quantity) {
        throw new BadRequestException(MESSAGES.PRODUCT.INSUFFICIENT_STOCK);
      }

      const itemPrice = Number(product.price);
      const itemSubtotal = itemPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        productName: product.title,
        productImage: product.images[0]?.imageUrl,
        price: itemPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    // Calculate totals
    const tax = 0; // TODO: Calculate tax if needed
    const shipping = 0; // TODO: Calculate shipping if needed
    const discount = 0; // TODO: Calculate discount if needed
    const total = subtotal + tax + shipping - discount;

    // Reserve stock for all products
    for (const item of createOrderDto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (product) {
        const newReservedStock = product.reservedStock + item.quantity;
        const newAvailableStock = product.stock - newReservedStock;
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            reservedStock: newReservedStock,
            availableStock: newAvailableStock,
            updatedAt: BigInt(Date.now()),
          },
        });
      }
    }

    // Create order
    const now = BigInt(Date.now());
    const order = await this.orderRepository.create({
      userId,
      storeId: createOrderDto.storeId,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: createOrderDto.paymentMethod,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      currency: 'VND',
      shippingAddressId: createOrderDto.shippingAddressId,
      billingAddressId: createOrderDto.billingAddressId,
      notes: createOrderDto.notes,
      createdAt: now,
      updatedAt: now,
    });

    // Create order items
    for (const item of orderItems) {
      await this.prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    return this.findOne(order.id);
  }

  async findAll(
    userId: number,
    queryDto: QueryOrderDto,
    isAdmin: boolean = false,
  ): Promise<{
    data: Order[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    let orders: Order[];
    let total: number;

    if (isAdmin) {
      // Admin can see all orders
      const allOrders = await this.prisma.order.findMany({
        where: {
          ...(queryDto.status && { status: queryDto.status }),
          ...(queryDto.paymentStatus && { paymentStatus: queryDto.paymentStatus }),
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      orders = allOrders.map((o: any) => ({
        id: o.id,
        userId: o.userId,
        storeId: o.storeId,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        subtotal: o.subtotal ? Number(o.subtotal) : 0,
        tax: o.tax ? Number(o.tax) : 0,
        shipping: o.shipping ? Number(o.shipping) : 0,
        discount: o.discount ? Number(o.discount) : 0,
        total: o.total ? Number(o.total) : 0,
        currency: o.currency,
        shippingAddressId: o.shippingAddressId,
        billingAddressId: o.billingAddressId,
        notes: o.notes,
        sellerNotes: o.sellerNotes,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        items: o.items
          ? o.items.map((item: any) => ({
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
      }));
      total = await this.orderRepository.count({
        status: queryDto.status,
        paymentStatus: queryDto.paymentStatus,
      });
    } else if (queryDto.storeId) {
      // Seller viewing their store orders
      const store = await this.prisma.store.findUnique({
        where: { id: queryDto.storeId },
      });
      if (!store || store.userId !== userId) {
        throw new ForbiddenException(MESSAGES.ORDER.CANNOT_VIEW_STORE_ORDERS);
      }
      orders = await this.orderRepository.findByStoreId(queryDto.storeId, {
        status: queryDto.status,
        paymentStatus: queryDto.paymentStatus,
        skip,
        take: limit,
      });
      total = await this.orderRepository.count({
        storeId: queryDto.storeId,
        status: queryDto.status,
        paymentStatus: queryDto.paymentStatus,
      });
    } else {
      // Buyer viewing their own orders
      orders = await this.orderRepository.findByUserId(userId, {
        status: queryDto.status,
        paymentStatus: queryDto.paymentStatus,
        skip,
        take: limit,
      });
      total = await this.orderRepository.count({
        userId,
        status: queryDto.status,
        paymentStatus: queryDto.paymentStatus,
      });
    }

    return {
      data: orders,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number, userId: number, isAdmin: boolean = false): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(MESSAGES.ORDER.NOT_FOUND);
    }

    // Check permission
    if (!isAdmin) {
      if (order.userId !== userId) {
        // Check if user is the store owner
        const store = await this.prisma.store.findUnique({
          where: { id: order.storeId },
        });
        if (!store || store.userId !== userId) {
          throw new ForbiddenException(MESSAGES.ORDER.CANNOT_VIEW);
        }
      }
    }

    return order;
  }

  async update(
    id: number,
    userId: number,
    updateOrderDto: UpdateOrderDto,
    isAdmin: boolean = false,
  ): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(MESSAGES.ORDER.NOT_FOUND);
    }

    // Check permission
    const store = await this.prisma.store.findUnique({
      where: { id: order.storeId },
    });
    const isStoreOwner = store && store.userId === userId;

    if (!isAdmin && order.userId !== userId && !isStoreOwner) {
      throw new ForbiddenException(MESSAGES.ORDER.CANNOT_UPDATE);
    }

    // Buyer can only update notes
    if (order.userId === userId && !isAdmin) {
      if (updateOrderDto.status || updateOrderDto.paymentStatus || updateOrderDto.sellerNotes) {
        throw new ForbiddenException(MESSAGES.ORDER.BUYER_CAN_ONLY_UPDATE_NOTES);
      }
    }

    // Seller can only update status and sellerNotes
    if (isStoreOwner && !isAdmin) {
      if (updateOrderDto.paymentStatus || updateOrderDto.paymentMethod) {
        throw new ForbiddenException(MESSAGES.ORDER.CANNOT_UPDATE_STATUS);
      }
    }

    // Handle status changes
    if (updateOrderDto.status) {
      await this.handleStatusChange(order, updateOrderDto.status);
    }

    // Handle payment status changes
    if (updateOrderDto.paymentStatus) {
      await this.handlePaymentStatusChange(order, updateOrderDto.paymentStatus);
    }

    return this.orderRepository.update(id, updateOrderDto);
  }

  async cancel(id: number, userId: number): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(MESSAGES.ORDER.NOT_FOUND);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException(MESSAGES.ORDER.CANNOT_CANCEL);
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException(MESSAGES.ORDER.CANNOT_CANCEL_COMPLETED);
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(MESSAGES.ORDER.ALREADY_CANCELLED);
    }

    // Release reserved stock
    await this.releaseStock(order.id);

    return this.orderRepository.updateStatus(id, OrderStatus.CANCELLED);
  }

  private async handleStatusChange(
    order: Order,
    newStatus: OrderStatus,
  ): Promise<void> {
    if (order.status === newStatus) {
      return;
    }

    // Handle stock when order is completed
    if (newStatus === OrderStatus.COMPLETED && order.status !== OrderStatus.COMPLETED) {
      await this.completeOrder(order.id);
    }

    // Handle stock when order is cancelled
    if (newStatus === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      await this.releaseStock(order.id);
    }
  }

  private async handlePaymentStatusChange(
    order: Order,
    newPaymentStatus: PaymentStatus,
  ): Promise<void> {
    if (order.paymentStatus === newPaymentStatus) {
      return;
    }

    // Auto-confirm order when payment is completed
    if (
      newPaymentStatus === PaymentStatus.COMPLETED &&
      order.status === OrderStatus.PENDING
    ) {
      await this.orderRepository.updateStatus(order.id, OrderStatus.CONFIRMED);
    }

    // Handle refund
    if (newPaymentStatus === PaymentStatus.REFUNDED) {
      await this.releaseStock(order.id);
      await this.orderRepository.updateStatus(order.id, OrderStatus.REFUNDED);
    }
  }

  private async completeOrder(orderId: number): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return;

    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    for (const item of orderItems) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (product) {
        // Deduct actual stock
        const newStock = product.stock - item.quantity;
        const newReservedStock = product.reservedStock - item.quantity;
        const newAvailableStock = newStock - newReservedStock;
        const newSalesCount = product.salesCount + item.quantity;

        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
            reservedStock: newReservedStock,
            availableStock: newAvailableStock,
            salesCount: newSalesCount,
            updatedAt: BigInt(Date.now()),
          },
        });
      }
    }
  }

  private async releaseStock(orderId: number): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return;

    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    for (const item of orderItems) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (product) {
        // Release reserved stock
        const newReservedStock = Math.max(0, product.reservedStock - item.quantity);
        const newAvailableStock = product.stock - newReservedStock;

        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            reservedStock: newReservedStock,
            availableStock: newAvailableStock,
            updatedAt: BigInt(Date.now()),
          },
        });
      }
    }
  }
}

