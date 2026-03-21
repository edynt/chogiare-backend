import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { ORDER_STATUS, PAYMENT_STATUS } from '@common/constants/enum.constants';

export interface RevenueParams {
  period?: 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
}

export interface RevenueDataPoint {
  date?: string;
  week?: string;
  month?: string;
  revenue: number;
  orders: number;
}

export interface RevenueStats {
  daily: RevenueDataPoint[];
  weekly: RevenueDataPoint[];
  monthly: RevenueDataPoint[];
  total: number;
  averageOrderValue: number;
}

export interface DashboardStats {
  totalProducts: {
    value: number;
    change: number;
    changeType: 'positive' | 'negative';
    subtitle: string;
  };
  revenue: {
    value: number;
    change: number;
    changeType: 'positive' | 'negative';
    subtitle: string;
  };
  orders: {
    value: number;
    change: number;
    changeType: 'positive' | 'negative';
    subtitle: string;
  };
  views: {
    value: number;
    change: number;
    changeType: 'positive' | 'negative';
    subtitle: string;
  };
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalCustomers: number;
  activeProducts: number;
  soldProducts: number;
  lowStockProducts: number;
}

@Injectable()
export class SellerDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(sellerId: number): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const startOfMonthMs = BigInt(startOfMonth.getTime());
    const startOfPrevMonthMs = BigInt(startOfPrevMonth.getTime());
    const endOfPrevMonthMs = BigInt(endOfPrevMonth.getTime());
    const nowMs = BigInt(now.getTime());

    // Get products stats
    const [totalProducts, prevMonthProducts] = await Promise.all([
      this.prisma.product.count({ where: { sellerId } }),
      this.prisma.product.count({
        where: {
          sellerId,
          createdAt: { lt: startOfMonthMs },
        },
      }),
    ]);

    const activeProducts = await this.prisma.product.count({
      where: { sellerId, status: 1 }, // ACTIVE
    });

    // Get orders stats - ONLY COMPLETED orders for revenue
    const [currentMonthOrders, prevMonthOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          sellerId,
          createdAt: { gte: startOfMonthMs, lte: nowMs },
          status: ORDER_STATUS.COMPLETED,
          paymentStatus: PAYMENT_STATUS.COMPLETED,
        },
        select: { total: true },
      }),
      this.prisma.order.findMany({
        where: {
          sellerId,
          createdAt: { gte: startOfPrevMonthMs, lte: endOfPrevMonthMs },
          status: ORDER_STATUS.COMPLETED,
          paymentStatus: PAYMENT_STATUS.COMPLETED,
        },
        select: { total: true },
      }),
    ]);

    const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const prevRevenue = prevMonthOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const currentOrderCount = currentMonthOrders.length;
    const prevOrderCount = prevMonthOrders.length;
    const orderChange = prevOrderCount > 0 ? ((currentOrderCount - prevOrderCount) / prevOrderCount) * 100 : 0;

    // Total orders (all statuses)
    const [totalOrders, pendingOrders, completedOrders] = await Promise.all([
      this.prisma.order.count({ where: { sellerId } }),
      this.prisma.order.count({ where: { sellerId, status: ORDER_STATUS.PENDING } }),
      this.prisma.order.count({ where: { sellerId, status: ORDER_STATUS.COMPLETED } }),
    ]);

    // Get unique customers
    const customersResult = await this.prisma.order.groupBy({
      by: ['buyerId'],
      where: { sellerId },
    });
    const totalCustomers = customersResult.length;

    // Get products sold count (from completed orders)
    const soldProducts = completedOrders;

    // Get low stock products (stock <= 5 and still active)
    const lowStockProducts = await this.prisma.product.count({
      where: { sellerId, status: 1, stock: { lte: 5, gt: 0 } },
    });

    // Get views from products
    const viewsResult = await this.prisma.product.aggregate({
      where: { sellerId },
      _sum: { viewCount: true },
    });
    const totalViews = viewsResult._sum.viewCount || 0;

    // Calculate product change
    const productChange = prevMonthProducts > 0 ? ((totalProducts - prevMonthProducts) / prevMonthProducts) * 100 : 0;

    return {
      totalProducts: {
        value: totalProducts,
        change: productChange,
        changeType: productChange >= 0 ? 'positive' : 'negative',
        subtitle: `${activeProducts} đang bán`,
      },
      revenue: {
        value: currentRevenue,
        change: revenueChange,
        changeType: revenueChange >= 0 ? 'positive' : 'negative',
        subtitle: 'Tháng này',
      },
      orders: {
        value: currentOrderCount,
        change: orderChange,
        changeType: orderChange >= 0 ? 'positive' : 'negative',
        subtitle: 'Đã hoàn thành',
      },
      views: {
        value: totalViews,
        change: 0,
        changeType: 'positive',
        subtitle: 'Tổng lượt xem',
      },
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCustomers,
      activeProducts,
      soldProducts,
      lowStockProducts,
    };
  }

  async getRevenueStats(sellerId: number, params: RevenueParams): Promise<RevenueStats> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = params.endDate ? new Date(params.endDate) : now;

    if (params.startDate) {
      startDate = new Date(params.startDate);
    } else {
      // Default: last 12 months
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    }

    const startMs = BigInt(startDate.getTime());
    const endMs = BigInt(endDate.getTime());

    // Get ONLY COMPLETED orders for revenue calculation
    const orders = await this.prisma.order.findMany({
      where: {
        sellerId,
        createdAt: { gte: startMs, lte: endMs },
        status: ORDER_STATUS.COMPLETED,
        paymentStatus: PAYMENT_STATUS.COMPLETED,
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by daily
    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    const weeklyMap = new Map<string, { revenue: number; orders: number }>();
    const monthlyMap = new Map<string, { revenue: number; orders: number }>();

    let totalRevenue = 0;

    orders.forEach((order) => {
      const date = new Date(Number(order.createdAt));
      const revenue = Number(order.total);
      totalRevenue += revenue;

      // Daily key: YYYY-MM-DD
      const dailyKey = date.toISOString().split('T')[0];
      const dailyData = dailyMap.get(dailyKey) || { revenue: 0, orders: 0 };
      dailyData.revenue += revenue;
      dailyData.orders += 1;
      dailyMap.set(dailyKey, dailyData);

      // Weekly key: YYYY-WXX
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getDate() + 1) / 7).toString().padStart(2, '0')}`;
      const weeklyData = weeklyMap.get(weekKey) || { revenue: 0, orders: 0 };
      weeklyData.revenue += revenue;
      weeklyData.orders += 1;
      weeklyMap.set(weekKey, weeklyData);

      // Monthly key: YYYY-MM (with Vietnamese month name)
      const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      const monthlyData = monthlyMap.get(monthKey) || { revenue: 0, orders: 0 };
      monthlyData.revenue += revenue;
      monthlyData.orders += 1;
      monthlyMap.set(monthKey, monthlyData);
    });

    // Convert maps to arrays
    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }));

    const weekly = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      revenue: data.revenue,
      orders: data.orders,
    }));

    const monthly = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orders: data.orders,
    }));

    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    return {
      daily,
      weekly,
      monthly,
      total: totalRevenue,
      averageOrderValue: Math.round(averageOrderValue),
    };
  }
}
