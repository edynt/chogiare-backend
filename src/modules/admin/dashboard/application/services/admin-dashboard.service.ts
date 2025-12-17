import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { OrderStatus, PaymentStatus, UserRoleEnum, Prisma } from '@prisma/client';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const nowBigInt = BigInt(now.getTime());
    const lastMonthBigInt = BigInt(lastMonth.getTime());

    const [totalUsers, lastMonthUsers, sellers, buyers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonthBigInt,
            lt: nowBigInt,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          userRoles: {
            some: {
              role: {
                name: UserRoleEnum.seller,
              },
            },
          },
        },
      }),
      this.prisma.user.count({
        where: {
          userRoles: {
            some: {
              role: {
                name: UserRoleEnum.buyer,
              },
            },
          },
        },
      }),
    ]);

    const [totalProducts, activeProducts, pendingProducts] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({
        where: {
          status: 'active',
        },
      }),
      this.prisma.product.count({
        where: {
          status: 'draft',
        },
      }),
    ]);

    const [totalOrders, completedOrders, processingOrders] = await Promise.all([
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: lastMonthBigInt,
            lt: nowBigInt,
          },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: lastMonthBigInt,
            lt: nowBigInt,
          },
          status: OrderStatus.completed,
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: lastMonthBigInt,
            lt: nowBigInt,
          },
          status: {
            in: [OrderStatus.confirmed, OrderStatus.ready_for_pickup],
          },
        },
      }),
    ]);

    const previousMonthStart = new Date(
      lastMonth.getTime() - (now.getTime() - lastMonth.getTime()),
    );
    const previousMonthStartBigInt = BigInt(previousMonthStart.getTime());

    const [currentMonthRevenue, lastMonthRevenueData] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          createdAt: {
            gte: lastMonthBigInt,
            lt: nowBigInt,
          },
          status: { not: OrderStatus.cancelled },
          paymentStatus: PaymentStatus.completed,
        },
        _sum: {
          total: true,
        },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: {
            gte: previousMonthStartBigInt,
            lt: lastMonthBigInt,
          },
          status: { not: OrderStatus.cancelled },
          paymentStatus: PaymentStatus.completed,
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    const currentRevenue = currentMonthRevenue._sum.total
      ? Number(currentMonthRevenue._sum.total)
      : 0;
    const previousRevenue = lastMonthRevenueData._sum.total
      ? Number(lastMonthRevenueData._sum.total)
      : 0;
    const revenueChange =
      previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const userChange = totalUsers > 0 ? ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

    return {
      totalUsers: {
        value: totalUsers,
        change: userChange,
        changeType: userChange >= 0 ? 'positive' : 'negative',
        sellers,
        buyers,
      },
      totalProducts: {
        value: totalProducts,
        change: 8.2,
        changeType: 'positive' as const,
        active: activeProducts,
        pending: pendingProducts,
      },
      totalOrders: {
        value: totalOrders,
        change: 15.3,
        changeType: 'positive' as const,
        completed: completedOrders,
        processing: processingOrders,
      },
      revenue: {
        value: currentRevenue,
        change: revenueChange,
        changeType: revenueChange >= 0 ? 'positive' : 'negative',
        commission: currentRevenue * 0.05,
        profit: currentRevenue * 0.95,
      },
    };
  }

  async getRecentActivities(limit: number = 10) {
    const [recentUsers, recentProducts, recentOrders, recentPayments] = await Promise.all([
      this.prisma.user.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          userInfo: {
            select: {
              fullName: true,
            },
          },
          userRoles: {
            include: {
              role: true,
            },
          },
          createdAt: true,
        },
      }),
      this.prisma.product.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: {
          status: 'draft',
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.order.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: {
          status: OrderStatus.completed,
        },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.order.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: {
          paymentStatus: PaymentStatus.completed,
        },
        select: {
          id: true,
          total: true,
          paymentStatus: true,
          createdAt: true,
          store: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    const activities = [
      ...recentUsers.map((user) => {
        const userName = user.userInfo?.fullName || user.email;
        const isSeller = user.userRoles.some((ur) => ur.role.name === UserRoleEnum.seller);
        return {
          id: `user-${user.id}`,
          type: 'user_registration',
          title: 'Người dùng mới đăng ký',
          description: `${userName} đã đăng ký tài khoản ${isSeller ? 'người bán' : 'người mua'}`,
          time: this.getTimeAgo(user.createdAt),
          status: 'pending',
        };
      }),
      ...recentProducts.map((product) => ({
        id: `product-${product.id}`,
        type: 'product_approval',
        title: 'Sản phẩm cần duyệt',
        description: `${product.title} - Chờ phê duyệt`,
        time: this.getTimeAgo(product.createdAt),
        status: 'warning',
      })),
      ...recentOrders.map((order) => ({
        id: `order-${order.id}`,
        type: 'order_completed',
        title: 'Đơn hàng hoàn thành',
        description: `Đơn hàng #${order.id} đã được giao thành công`,
        time: this.getTimeAgo(order.createdAt),
        status: 'success',
      })),
      ...recentPayments.map((payment) => ({
        id: `payment-${payment.id}`,
        type: 'payment_received',
        title: 'Thanh toán nhận được',
        description: `Nhận thanh toán ${payment.total} VNĐ từ ${payment.store?.name || 'N/A'}`,
        time: this.getTimeAgo(payment.createdAt),
        status: 'success',
      })),
    ]
      .sort((a, b) => {
        const timeA = this.parseTimeAgo(a.time);
        const timeB = this.parseTimeAgo(b.time);
        return timeB - timeA;
      })
      .slice(0, limit);

    return activities;
  }

  async getTopSellers(limit: number = 5) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthBigInt = BigInt(lastMonth.getTime());

    const stores = await this.prisma.store.findMany({
      include: {
        orders: {
          where: {
            createdAt: {
              gte: lastMonthBigInt,
            },
            status: { not: OrderStatus.cancelled },
            paymentStatus: PaymentStatus.completed,
          },
          include: {
            items: true,
          },
        },
      },
    });

    type StoreWithOrders = Prisma.StoreGetPayload<{
      include: {
        orders: {
          include: {
            items: true;
          };
        };
      };
    }>;

    const sellersData = (stores as StoreWithOrders[])
      .map((store) => {
        const orders = store.orders;
        const revenue = orders.reduce((sum: number, order) => sum + Number(order.total), 0);
        const orderCount = orders.length;
        const avgRating = store.rating ? Number(store.rating) : 4.5;

        return {
          name: store.name,
          orders: orderCount,
          revenue,
          rating: avgRating,
        };
      })
      .filter((seller) => seller.orders > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return sellersData;
  }

  private getTimeAgo(createdAt: bigint | Date): string {
    const now = Date.now();
    const timestamp = typeof createdAt === 'bigint' ? Number(createdAt) : createdAt.getTime();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes} phút trước`;
    } else if (hours < 24) {
      return `${hours} giờ trước`;
    } else {
      return `${days} ngày trước`;
    }
  }

  private parseTimeAgo(timeStr: string): number {
    const match = timeStr.match(/(\d+)\s*(phút|giờ|ngày)/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2];

    if (unit === 'phút') return value;
    if (unit === 'giờ') return value * 60;
    if (unit === 'ngày') return value * 1440;
    return 0;
  }
}

