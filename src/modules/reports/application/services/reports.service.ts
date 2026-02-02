import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { TimeRange } from '../dto/query-revenue-report.dto';
import {
  ORDER_REPOSITORY,
  IOrderRepository,
} from '@modules/order/domain/repositories/order.repository.interface';
import { ORDER_STATUS, PAYMENT_STATUS } from '@common/constants/enum.constants';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly prisma: PrismaService,
  ) {}

  private getDateRange(
    timeRange?: TimeRange,
    dateFrom?: string,
    dateTo?: string,
  ): { start: Date; end: Date } {
    const end = dateTo ? new Date(dateTo) : new Date();
    let start: Date;

    if (dateFrom) {
      start = new Date(dateFrom);
    } else if (timeRange) {
      start = new Date();
      switch (timeRange) {
        case TimeRange.SEVEN_DAYS:
          start.setDate(start.getDate() - 7);
          break;
        case TimeRange.THIRTY_DAYS:
          start.setDate(start.getDate() - 30);
          break;
        case TimeRange.NINETY_DAYS:
          start.setDate(start.getDate() - 90);
          break;
        case TimeRange.ONE_YEAR:
          start.setFullYear(start.getFullYear() - 1);
          break;
      }
    } else {
      start = new Date();
      start.setDate(start.getDate() - 30);
    }

    return { start, end };
  }

  async getRevenueOverview(
    storeId?: number,
    timeRange?: TimeRange,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const { start, end } = this.getDateRange(timeRange, dateFrom, dateTo);
    const startBigInt = BigInt(start.getTime());
    const endBigInt = BigInt(end.getTime());
    const previousStart = new Date(start);
    previousStart.setTime(start.getTime() - (end.getTime() - start.getTime()));
    const previousStartBigInt = BigInt(previousStart.getTime());

    const whereCurrent = {
      createdAt: { gte: startBigInt, lte: endBigInt },
      status: { not: ORDER_STATUS.CANCELLED },
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      ...(storeId && { storeId }),
    };

    const wherePrevious = {
      createdAt: { gte: previousStartBigInt, lt: startBigInt },
      status: { not: ORDER_STATUS.CANCELLED },
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      ...(storeId && { storeId }),
    };

    const [currentOrders, previousOrders, currentStats, previousStats] = await Promise.all([
      this.prisma.order.findMany({
        where: whereCurrent,
        include: { items: true },
      }),
      this.prisma.order.findMany({
        where: wherePrevious,
        include: { items: true },
      }),
      this.prisma.order.aggregate({
        where: whereCurrent,
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: wherePrevious,
        _sum: { total: true },
        _count: true,
      }),
    ]);

    const currentRevenue = currentStats._sum.total ? Number(currentStats._sum.total) : 0;
    const previousRevenue = previousStats._sum.total ? Number(previousStats._sum.total) : 0;
    const revenueChange =
      previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const currentOrderCount = currentStats._count;
    const previousOrderCount = previousStats._count;
    const orderChange =
      previousOrderCount > 0
        ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100
        : 0;

    const currentProductsSold = currentOrders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );
    const previousProductsSold = previousOrders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );
    const productsChange =
      previousProductsSold > 0
        ? ((currentProductsSold - previousProductsSold) / previousProductsSold) * 100
        : 0;

    const currentProfit = currentRevenue * 0.2;
    const previousProfit = previousRevenue * 0.2;
    const profitChange =
      previousProfit > 0 ? ((currentProfit - previousProfit) / previousProfit) * 100 : 0;

    return {
      totalRevenue: {
        value: currentRevenue,
        change: revenueChange,
        changeType: revenueChange >= 0 ? 'positive' : 'negative',
      },
      totalOrders: {
        value: currentOrderCount,
        change: orderChange,
        changeType: orderChange >= 0 ? 'positive' : 'negative',
      },
      productsSold: {
        value: currentProductsSold,
        change: productsChange,
        changeType: productsChange >= 0 ? 'positive' : 'negative',
      },
      profit: {
        value: currentProfit,
        change: profitChange,
        changeType: profitChange >= 0 ? 'positive' : 'negative',
      },
    };
  }

  async getRevenueData(
    storeId?: number,
    timeRange?: TimeRange,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const { start, end } = this.getDateRange(timeRange, dateFrom, dateTo);
    const startBigInt = BigInt(start.getTime());
    const endBigInt = BigInt(end.getTime());

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startBigInt, lte: endBigInt },
        status: { not: ORDER_STATUS.CANCELLED },
        paymentStatus: PAYMENT_STATUS.COMPLETED,
        ...(storeId && { storeId }),
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const dateMap = new Map<string, { revenue: number; orders: number; productsSold: number }>();

    orders.forEach((order) => {
      const dateKey = new Date(Number(order.createdAt)).toISOString().split('T')[0];
      const existing = dateMap.get(dateKey) || { revenue: 0, orders: 0, productsSold: 0 };

      existing.revenue += Number(order.total);
      existing.orders += 1;
      existing.productsSold += order.items.reduce((sum, item) => sum + item.quantity, 0);

      dateMap.set(dateKey, existing);
    });

    const result = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
        productsSold: data.productsSold,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  async getTopProducts(
    storeId?: number,
    timeRange?: TimeRange,
    dateFrom?: string,
    dateTo?: string,
    limit: number = 5,
  ) {
    const { start, end } = this.getDateRange(timeRange, dateFrom, dateTo);
    const startBigInt = BigInt(start.getTime());
    const endBigInt = BigInt(end.getTime());

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startBigInt, lte: endBigInt },
        status: { not: ORDER_STATUS.CANCELLED },
        paymentStatus: PAYMENT_STATUS.COMPLETED,
        ...(storeId && { storeId }),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const productMap = new Map<
      number,
      { name: string; orders: number; revenue: number; quantity: number }
    >();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.productId;
        const existing = productMap.get(productId) || {
          name: item.product.title,
          orders: 0,
          revenue: 0,
          quantity: 0,
        };

        existing.orders += 1;
        existing.revenue += Number(item.price) * item.quantity;
        existing.quantity += item.quantity;

        productMap.set(productId, existing);
      });
    });

    const previousStart = new Date(start);
    previousStart.setTime(start.getTime() - (end.getTime() - start.getTime()));
    const previousStartBigInt = BigInt(previousStart.getTime());

    const previousOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: previousStartBigInt, lt: startBigInt },
        status: { not: ORDER_STATUS.CANCELLED },
        paymentStatus: PAYMENT_STATUS.COMPLETED,
        ...(storeId && { storeId }),
      },
      include: {
        items: true,
      },
    });

    const previousProductMap = new Map<number, number>();
    previousOrders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = previousProductMap.get(item.productId) || 0;
        previousProductMap.set(item.productId, existing + item.quantity);
      });
    });

    const result = Array.from(productMap.entries())
      .map(([productId, data]) => {
        const previousQuantity = previousProductMap.get(productId) || 0;
        const growth =
          previousQuantity > 0
            ? ((data.quantity - previousQuantity) / previousQuantity) * 100
            : 100;

        return {
          productId,
          name: data.name,
          orders: data.orders,
          revenue: data.revenue,
          quantity: data.quantity,
          growth: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return result;
  }

  async getCategoryRevenue(
    storeId?: number,
    timeRange?: TimeRange,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const { start, end } = this.getDateRange(timeRange, dateFrom, dateTo);
    const startBigInt = BigInt(start.getTime());
    const endBigInt = BigInt(end.getTime());

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startBigInt, lte: endBigInt },
        status: { not: ORDER_STATUS.CANCELLED },
        paymentStatus: PAYMENT_STATUS.COMPLETED,
        ...(storeId && { storeId }),
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    const categoryMap = new Map<string, { name: string; revenue: number; orders: number }>();
    let totalRevenue = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const categoryName = item.product.category?.name || 'Khác';
        const existing = categoryMap.get(categoryName) || {
          name: categoryName,
          revenue: 0,
          orders: 0,
        };

        const itemRevenue = Number(item.price) * item.quantity;
        existing.revenue += itemRevenue;
        existing.orders += 1;
        totalRevenue += itemRevenue;

        categoryMap.set(categoryName, existing);
      });
    });

    const result = Array.from(categoryMap.values())
      .map((data) => ({
        name: data.name,
        revenue: data.revenue,
        orders: data.orders,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return result;
  }
}
