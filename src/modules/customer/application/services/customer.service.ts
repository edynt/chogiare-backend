import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import {
  ICustomerRepository,
  CUSTOMER_REPOSITORY,
} from '@modules/customer/domain/repositories/customer.repository.interface';
import { RolePermissionService } from '@modules/auth/application/services/role-permission.service';
import { QueryCustomerDto } from '../dto/query-customer.dto';
import { UpdateCustomerStatusDto } from '../dto/update-customer-status.dto';

@Injectable()
export class CustomerService {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    private readonly rolePermissionService: RolePermissionService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(queryDto: QueryCustomerDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;

    const result = await this.customerRepository.findAll({
      search: queryDto.search,
      status: queryDto.status,
      isVerified: queryDto.isVerified,
      role: queryDto.role,
      page,
      pageSize,
    });

    return {
      items: result.items.map((customer) => ({
        ...customer,
        createdAt: customer.createdAt.toString(),
        updatedAt: customer.updatedAt.toString(),
      })),
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async findOne(id: number) {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundException({
        message: MESSAGES.CUSTOMER.NOT_FOUND,
        errorCode: ERROR_CODES.CUSTOMER_NOT_FOUND,
      });
    }

    const [orders, addresses, reviews, balance, statistics] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      this.prisma.address.findMany({
        where: { userId: id },
        orderBy: { isDefault: 'desc', createdAt: 'desc' },
      }),
      this.prisma.review.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          product: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.userBalance.findUnique({
        where: { userId: id },
      }),
      this.getCustomerStatistics(id),
    ]);

    return {
      ...customer,
      createdAt: customer.createdAt.toString(),
      updatedAt: customer.updatedAt.toString(),
      orders: orders.map((order) => ({
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: Number(order.total),
        currency: order.currency,
        createdAt: order.createdAt.toString(),
        store: order.store,
      })),
      addresses: addresses.map((addr) => ({
        id: addr.id,
        recipientName: addr.recipientName,
        recipientPhone: addr.recipientPhone,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        district: addr.district,
        ward: addr.ward,
        zipCode: addr.zipCode,
        country: addr.country,
        isDefault: addr.isDefault,
      })),
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        createdAt: review.createdAt.toString(),
        product: review.product,
      })),
      balance: balance
        ? {
            balance: Number(balance.balance),
            updatedAt: balance.updatedAt.toString(),
          }
        : null,
      statistics,
    };
  }

  async updateStatus(id: number, updateStatusDto: UpdateCustomerStatusDto) {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundException({
        message: MESSAGES.CUSTOMER.NOT_FOUND,
        errorCode: ERROR_CODES.CUSTOMER_NOT_FOUND,
      });
    }

    const updatedCustomer = await this.customerRepository.updateStatus(id, updateStatusDto.status);

    if (!updateStatusDto.status) {
      await this.prisma.session.deleteMany({
        where: { userId: id },
      });
    }

    return {
      ...updatedCustomer,
      createdAt: updatedCustomer.createdAt.toString(),
      updatedAt: updatedCustomer.updatedAt.toString(),
    };
  }

  async assignRole(customerId: number, roleName: string) {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundException({
        message: MESSAGES.CUSTOMER.NOT_FOUND,
        errorCode: ERROR_CODES.CUSTOMER_NOT_FOUND,
      });
    }

    await this.rolePermissionService.assignRoleToUser(customerId, roleName);

    return {
      message: MESSAGES.CUSTOMER.ROLE_ASSIGNED,
    };
  }

  async removeRole(customerId: number, roleName: string) {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundException({
        message: MESSAGES.CUSTOMER.NOT_FOUND,
        errorCode: ERROR_CODES.CUSTOMER_NOT_FOUND,
      });
    }

    const userRoles = await this.rolePermissionService.getUserRoles(customerId);
    if (!userRoles.includes(roleName)) {
      throw new BadRequestException({
        message: MESSAGES.CUSTOMER.ROLE_NOT_ASSIGNED,
        errorCode: ERROR_CODES.CUSTOMER_ROLE_NOT_ASSIGNED,
      });
    }

    await this.rolePermissionService.removeRoleFromUser(customerId, roleName);

    return {
      message: MESSAGES.CUSTOMER.ROLE_REMOVED,
    };
  }

  async getStatistics() {
    const [
      totalCustomers,
      activeCustomers,
      lockedCustomers,
      verifiedCustomers,
      unverifiedCustomers,
      users,
      admins,
      newCustomersThisMonth,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: true } }),
      this.prisma.user.count({ where: { status: false } }),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.user.count({ where: { isVerified: false } }),
      this.prisma.userRole.count({
        where: { role: { name: 'user' } },
      }),
      this.prisma.userRole.count({
        where: { role: { name: 'admin' } },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: BigInt(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalCustomers,
      activeCustomers,
      lockedCustomers,
      verifiedCustomers,
      unverifiedCustomers,
      users,
      admins,
      newCustomersThisMonth,
    };
  }

  private async getCustomerStatistics(customerId: number) {
    const [totalOrders, completedOrders, totalSpent, totalReviews, averageRating, totalProducts] =
      await Promise.all([
        this.prisma.order.count({
          where: { userId: customerId },
        }),
        this.prisma.order.count({
          where: {
            userId: customerId,
            status: 'completed',
          },
        }),
        this.prisma.order.aggregate({
          where: {
            userId: customerId,
            paymentStatus: 'completed',
          },
          _sum: {
            total: true,
          },
        }),
        this.prisma.review.count({
          where: { userId: customerId },
        }),
        this.prisma.review.aggregate({
          where: { userId: customerId },
          _avg: {
            rating: true,
          },
        }),
        this.prisma.product.count({
          where: { sellerId: customerId },
        }),
      ]);

    return {
      totalOrders,
      completedOrders,
      totalSpent: totalSpent._sum.total ? Number(totalSpent._sum.total) : 0,
      totalReviews,
      averageRating: averageRating._avg.rating ? Number(averageRating._avg.rating) : 0,
      totalProducts,
    };
  }
}
