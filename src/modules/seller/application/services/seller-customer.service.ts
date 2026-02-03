import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { QuerySellerCustomerDto } from '../dto/query-seller-customer.dto';
import { Prisma } from '@prisma/client';

export interface SellerCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  status: 'active' | 'inactive';
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
  }>;
}

@Injectable()
export class SellerCustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomers(sellerId: number, queryDto: QuerySellerCustomerDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;
    const offset = (page - 1) * pageSize;
    const thirtyDaysAgoMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Use raw SQL for efficient aggregation with pagination
    // Orders now use sellerId directly (was storeId), buyerId (was userId)
    const customersQuery = Prisma.sql`
      SELECT
        u.id,
        u.email,
        u.full_name as "fullName",
        u.phone_number as "phoneNumber",
        u.avatar_url as "avatarUrl",
        COUNT(o.id)::int as "totalOrders",
        COALESCE(SUM(o.total), 0)::numeric as "totalSpent",
        MAX(o.created_at) as "lastOrderDate"
      FROM orders o
      INNER JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = ${sellerId}
      ${
        queryDto.search
          ? Prisma.sql`
        AND (
          u.full_name ILIKE ${`%${queryDto.search}%`}
          OR u.email ILIKE ${`%${queryDto.search}%`}
          OR u.phone_number LIKE ${`%${queryDto.search}%`}
        )
      `
          : Prisma.empty
      }
      GROUP BY u.id, u.email, u.full_name, u.phone_number, u.avatar_url
      ORDER BY MAX(o.created_at) DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    const countQuery = Prisma.sql`
      SELECT COUNT(DISTINCT o.buyer_id)::int as count
      FROM orders o
      INNER JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = ${sellerId}
      ${
        queryDto.search
          ? Prisma.sql`
        AND (
          u.full_name ILIKE ${`%${queryDto.search}%`}
          OR u.email ILIKE ${`%${queryDto.search}%`}
          OR u.phone_number LIKE ${`%${queryDto.search}%`}
        )
      `
          : Prisma.empty
      }
    `;

    const [customers, countResult] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{
          id: number;
          email: string;
          fullName: string | null;
          phoneNumber: string | null;
          avatarUrl: string | null;
          totalOrders: number;
          totalSpent: string | number;
          lastOrderDate: bigint;
        }>
      >(customersQuery),
      this.prisma.$queryRaw<Array<{ count: number }>>(countQuery),
    ]);

    const total = countResult[0]?.count || 0;

    const items: SellerCustomer[] = customers.map((c) => ({
      id: c.id.toString(),
      name: c.fullName || 'Unknown',
      email: c.email,
      phone: c.phoneNumber || undefined,
      avatar: c.avatarUrl || undefined,
      totalOrders: c.totalOrders,
      totalSpent: Number(c.totalSpent),
      lastOrderDate: new Date(Number(c.lastOrderDate)).toISOString(),
      status: Number(c.lastOrderDate) > thirtyDaysAgoMs ? 'active' : 'inactive',
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getCustomerStats(sellerId: number): Promise<CustomerStats> {
    const thirtyDaysAgoMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Use raw SQL for efficient stats calculation
    // Orders now use sellerId (was storeId), buyerId (was userId)
    const statsQuery = Prisma.sql`
      WITH customer_data AS (
        SELECT
          u.id,
          u.email,
          u.full_name as "fullName",
          COUNT(o.id)::int as "totalOrders",
          COALESCE(SUM(o.total), 0)::numeric as "totalSpent",
          MIN(o.created_at) as "firstOrderDate",
          MAX(o.created_at) as "lastOrderDate"
        FROM orders o
        INNER JOIN users u ON o.buyer_id = u.id
        WHERE o.seller_id = ${sellerId}
        GROUP BY u.id, u.email, u.full_name
      )
      SELECT
        COUNT(*)::int as "totalCustomers",
        COUNT(CASE WHEN "lastOrderDate" > ${thirtyDaysAgoMs} THEN 1 END)::int as "activeCustomers",
        COUNT(CASE WHEN "firstOrderDate" > ${thirtyDaysAgoMs} THEN 1 END)::int as "newCustomers",
        COUNT(CASE WHEN "totalOrders" > 1 THEN 1 END)::int as "returningCustomers"
      FROM customer_data
    `;

    const topCustomersQuery = Prisma.sql`
      SELECT
        u.id,
        u.email,
        u.full_name as "fullName",
        COUNT(o.id)::int as "totalOrders",
        COALESCE(SUM(o.total), 0)::numeric as "totalSpent"
      FROM orders o
      INNER JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = ${sellerId}
      GROUP BY u.id, u.email, u.full_name
      ORDER BY SUM(o.total) DESC
      LIMIT 5
    `;

    const [statsResult, topCustomersResult] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{
          totalCustomers: number;
          activeCustomers: number;
          newCustomers: number;
          returningCustomers: number;
        }>
      >(statsQuery),
      this.prisma.$queryRaw<
        Array<{
          id: number;
          email: string;
          fullName: string | null;
          totalOrders: number;
          totalSpent: string | number;
        }>
      >(topCustomersQuery),
    ]);

    const stats = statsResult[0] || {
      totalCustomers: 0,
      activeCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
    };

    const topCustomers = topCustomersResult.map((c) => ({
      id: c.id.toString(),
      name: c.fullName || 'Unknown',
      email: c.email,
      totalOrders: c.totalOrders,
      totalSpent: Number(c.totalSpent),
    }));

    return {
      totalCustomers: stats.totalCustomers,
      activeCustomers: stats.activeCustomers,
      newCustomers: stats.newCustomers,
      returningCustomers: stats.returningCustomers,
      topCustomers,
    };
  }

  async getCustomerOrders(
    sellerId: number,
    customerId: number,
    pagination: { page?: number; pageSize?: number },
  ) {
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 10;
    const skip = (page - 1) * pageSize;

    // Verify customer has ordered from this seller
    // Order model: sellerId (was storeId), buyerId (was userId)
    const hasOrdered = await this.prisma.order.findFirst({
      where: { sellerId, buyerId: customerId },
      select: { id: true },
    });

    if (!hasOrdered) {
      throw new NotFoundException('Customer not found for this seller');
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { sellerId, buyerId: customerId },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              productName: true,
              productImage: true,
              quantity: true,
              price: true,
              subtotal: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.order.count({
        where: { sellerId, buyerId: customerId },
      }),
    ]);

    const items = orders.map((order) => ({
      id: order.id.toString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      itemCount: order.items.length,
      items: order.items.map((item) => ({
        id: item.id.toString(),
        productId: item.productId.toString(),
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })),
      createdAt: new Date(Number(order.createdAt)).toISOString(),
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
