import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { ICustomerRepository } from '@modules/customer/domain/repositories/customer.repository.interface';
import { Customer } from '@modules/customer/domain/entities/customer.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Customer | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  async findAll(options?: {
    search?: string;
    status?: boolean;
    isVerified?: boolean;
    role?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Customer[]; total: number }> {
    const where: Prisma.UserWhereInput = {};

    if (options?.status !== undefined) {
      where.status = options.status;
    }

    if (options?.isVerified !== undefined) {
      where.isVerified = options.isVerified;
    }

    if (options?.search) {
      where.OR = [
        { email: { contains: options.search, mode: 'insensitive' } },
        { fullName: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options?.role) {
      where.userRoles = {
        some: {
          role: {
            name: options.role,
          },
        },
      };
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((user) => this.toDomain(user)),
      total,
    };
  }

  async updateStatus(id: number, status: boolean): Promise<Customer> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status, updatedAt: BigInt(Date.now()) },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.toDomain(user);
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id },
    });
    return count > 0;
  }

  private toDomain(user: {
    id: number;
    email: string;
    isVerified: boolean;
    status: boolean;
    language: number;
    fullName: string | null;
    avatarUrl: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    phoneNumber: string | null;
    address: string | null;
    country: string | null;
    createdAt: bigint;
    updatedAt: bigint;
    userRoles: Array<{
      role: {
        name: string;
      };
    }>;
  }): Customer {
    return {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      status: user.status,
      language: user.language,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      userInfo: {
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        phoneNumber: user.phoneNumber,
        address: user.address,
        country: user.country,
      },
      roles: user.userRoles.map((ur) => ur.role.name),
    };
  }
}
