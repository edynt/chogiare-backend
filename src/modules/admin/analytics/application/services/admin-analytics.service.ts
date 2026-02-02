import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverviewStats(timeRange?: string) {
    const { start, end } = this.getDateRange(timeRange);
    const startBigInt = BigInt(start.getTime());
    const endBigInt = BigInt(end.getTime());
    const previousStartBigInt = BigInt(start.getTime() - (end.getTime() - start.getTime()));

    const [
      totalViews,
      previousViews,
      newUsers,
      previousUsers,
      orders,
      previousOrders,
      revenue,
      previousRevenue,
    ] = await Promise.all([
      this.prisma.product.aggregate({
        where: {
          createdAt: { gte: startBigInt, lte: endBigInt },
        },
        _sum: {
          viewCount: true,
        },
      }),
      this.prisma.product.aggregate({
        where: {
          createdAt: {
            gte: previousStartBigInt,
            lt: startBigInt,
          },
        },
        _sum: {
          viewCount: true,
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: startBigInt, lte: endBigInt },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: previousStartBigInt,
            lt: startBigInt,
          },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startBigInt, lte: endBigInt },
          status: { not: OrderStatus.cancelled },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: previousStartBigInt,
            lt: startBigInt,
          },
          status: { not: OrderStatus.cancelled },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: startBigInt, lte: endBigInt },
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
            gte: previousStartBigInt,
            lt: startBigInt,
          },
          status: { not: OrderStatus.cancelled },
          paymentStatus: PaymentStatus.completed,
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    const totalViewsCount = totalViews._sum.viewCount ? Number(totalViews._sum.viewCount) : 0;
    const previousViewsCount = previousViews._sum.viewCount
      ? Number(previousViews._sum.viewCount)
      : 0;
    const viewsChange =
      previousViewsCount > 0
        ? ((totalViewsCount - previousViewsCount) / previousViewsCount) * 100
        : 0;
    const usersChange = previousUsers > 0 ? ((newUsers - previousUsers) / previousUsers) * 100 : 0;
    const ordersChange =
      previousOrders > 0 ? ((orders - previousOrders) / previousOrders) * 100 : 0;
    const revenueTotal = revenue._sum.total ? Number(revenue._sum.total) : 0;
    const previousRevenueTotal = previousRevenue._sum.total
      ? Number(previousRevenue._sum.total)
      : 0;
    const revenueChange =
      previousRevenueTotal > 0
        ? ((revenueTotal - previousRevenueTotal) / previousRevenueTotal) * 100
        : 0;

    const conversionRate = totalViewsCount > 0 ? (orders / totalViewsCount) * 100 : 0;

    return {
      totalViews: {
        value: totalViewsCount,
        change: viewsChange,
        changeType: viewsChange >= 0 ? 'positive' : 'negative',
      },
      newUsers: {
        value: newUsers,
        change: usersChange,
        changeType: usersChange >= 0 ? 'positive' : 'negative',
      },
      orders: {
        value: orders,
        change: ordersChange,
        changeType: ordersChange >= 0 ? 'positive' : 'negative',
        conversionRate,
      },
      revenue: {
        value: revenueTotal,
        change: revenueChange,
        changeType: revenueChange >= 0 ? 'positive' : 'negative',
        profit: revenueTotal * 0.2,
      },
    };
  }

  async getTopProducts(limit: number = 5) {
    const products = await this.prisma.product.findMany({
      take: limit,
      orderBy: {
        reviewCount: 'desc',
      },
      include: {
        category: true,
        orderItems: {
          include: {
            order: true,
          },
        },
      },
    });

    return products.map((product) => {
      const completedOrderItems = product.orderItems.filter(
        (item) =>
          item.order &&
          item.order.status !== OrderStatus.cancelled &&
          item.order.paymentStatus === PaymentStatus.completed,
      );
      const revenue = completedOrderItems.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      );
      const uniqueOrderIds = new Set(completedOrderItems.map((item) => item.orderId));
      const orderCount = uniqueOrderIds.size;
      const views = product.viewCount || 0;

      return {
        name: product.title,
        views,
        orders: orderCount,
        revenue,
        growth: '+15%',
      };
    });
  }

  async getTopSellers(limit: number = 5) {
    const sellers = await this.prisma.user.findMany({
      where: {
        isSeller: true,
      },
      include: {
        sellerOrders: {
          where: {
            status: { not: OrderStatus.cancelled },
            paymentStatus: PaymentStatus.completed,
          },
        },
      },
    });

    return sellers
      .map((seller) => {
        const orders = seller.sellerOrders;
        const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
        const orderCount = orders.length;

        return {
          name: seller.sellerName || seller.fullName || seller.email,
          orders: orderCount,
          revenue,
          growth: '+25%',
          rating: 4.5,
        };
      })
      .filter((seller) => seller.orders > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  async getCategoryStats() {
    const categories = await this.prisma.category.findMany({
      include: {
        products: {
          include: {
            orderItems: {
              include: {
                order: true,
              },
            },
          },
        },
      },
    });

    let totalRevenue = 0;
    const categoryData = categories.map((category) => {
      const products = category.products;
      const revenue = products.reduce((sum, product) => {
        const completedOrderItems = product.orderItems.filter(
          (item) =>
            item.order &&
            item.order.status !== OrderStatus.cancelled &&
            item.order.paymentStatus === PaymentStatus.completed,
        );
        return (
          sum +
          completedOrderItems.reduce((itemSum, item) => {
            return itemSum + Number(item.price) * item.quantity;
          }, 0)
        );
      }, 0);
      const uniqueOrderIds = new Set(
        products.flatMap((product) =>
          product.orderItems
            .filter(
              (item) =>
                item.order &&
                item.order.status !== OrderStatus.cancelled &&
                item.order.paymentStatus === PaymentStatus.completed,
            )
            .map((item) => item.orderId),
        ),
      );
      const orderCount = uniqueOrderIds.size;
      const productCount = products.length;

      totalRevenue += revenue;

      return {
        name: category.name,
        products: productCount,
        orders: orderCount,
        revenue,
        percentage: 0,
      };
    });

    return categoryData
      .map((data) => ({
        ...data,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private getDateRange(timeRange?: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    return { start, end };
  }
}
