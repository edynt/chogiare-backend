import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { isAdmin } from '@common/utils/admin.utils';
import { QueryAdminOrderDto } from '../dto/query-admin-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrders(adminId: number, queryDto: QueryAdminOrderDto) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const where: Prisma.OrderWhereInput = {};

    if (queryDto.userId) {
      where.buyerId = queryDto.userId;
    }

    if (queryDto.storeId) {
      where.sellerId = queryDto.storeId;
    }

    if (queryDto.status) {
      where.status = queryDto.status;
    }

    if (queryDto.paymentStatus) {
      where.paymentStatus = queryDto.paymentStatus;
    }

    if (queryDto.search) {
      where.OR = [
        { notes: { contains: queryDto.search, mode: 'insensitive' } },
        { sellerNotes: { contains: queryDto.search, mode: 'insensitive' } },
        {
          buyer: {
            email: { contains: queryDto.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: true,
          seller: true,
          items: {
            include: {
              product: true,
            },
          },
          shippingAddress: true,
          billingAddress: true,
          transactions: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => ({
        ...order,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        shipping: Number(order.shipping),
        discount: Number(order.discount),
        total: Number(order.total),
        createdAt: order.createdAt.toString(),
        updatedAt: order.updatedAt.toString(),
        items: order.items.map((item) => ({
          ...item,
          price: Number(item.price),
          subtotal: Number(item.subtotal),
          createdAt: item.createdAt.toString(),
          updatedAt: item.updatedAt.toString(),
        })),
      })),
      total,
      page,
      pageSize,
    };
  }

  async getOrderById(adminId: number, orderId: number) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        seller: true,
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        transactions: true,
      },
    });

    if (!order) {
      throw new NotFoundException({
        message: MESSAGES.ADMIN.ORDER_NOT_FOUND,
        errorCode: ERROR_CODES.ADMIN_ORDER_NOT_FOUND,
      });
    }

    return {
      ...order,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shipping: Number(order.shipping),
      discount: Number(order.discount),
      total: Number(order.total),
      createdAt: order.createdAt.toString(),
      updatedAt: order.updatedAt.toString(),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        createdAt: item.createdAt.toString(),
        updatedAt: item.updatedAt.toString(),
      })),
    };
  }

  async updateOrderStatus(adminId: number, orderId: number, updateDto: UpdateOrderStatusDto) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException({
        message: MESSAGES.ADMIN.ORDER_NOT_FOUND,
        errorCode: ERROR_CODES.ADMIN_ORDER_NOT_FOUND,
      });
    }

    // Allow seller/admin to transition to any status without restrictions
    const orderMetadata = (order.orderMetadata as Record<string, unknown>) || {};
    if (updateDto.adminNotes) {
      orderMetadata.adminNotes = updateDto.adminNotes;
      orderMetadata.adminNotesUpdatedAt = Date.now();
      orderMetadata.adminNotesUpdatedBy = adminId;
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: updateDto.status,
        orderMetadata: orderMetadata as Prisma.InputJsonValue,
        updatedAt: BigInt(Date.now()),
      },
    });

    return {
      ...updated,
      subtotal: Number(updated.subtotal),
      tax: Number(updated.tax),
      shipping: Number(updated.shipping),
      discount: Number(updated.discount),
      total: Number(updated.total),
      createdAt: updated.createdAt.toString(),
      updatedAt: updated.updatedAt.toString(),
    };
  }

  async getOrderStatistics(adminId: number) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'pending' } }),
      this.prisma.order.count({ where: { status: 'completed' } }),
      this.prisma.order.count({ where: { status: 'cancelled' } }),
      this.prisma.order.aggregate({
        where: { status: 'completed', paymentStatus: 'completed' },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: BigInt(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          status: 'completed',
          paymentStatus: 'completed',
          createdAt: {
            gte: BigInt(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        _sum: { total: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.total ? Number(totalRevenue._sum.total) : 0,
      todayOrders,
      todayRevenue: todayRevenue._sum.total ? Number(todayRevenue._sum.total) : 0,
    };
  }
}
