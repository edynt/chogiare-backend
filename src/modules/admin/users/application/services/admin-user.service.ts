import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { isAdmin } from '@common/utils/admin.utils';
import { QueryAdminUserDto } from '../dto/query-admin-user.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(adminId: number, queryDto: QueryAdminUserDto) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const where: Prisma.UserWhereInput = {};

    if (queryDto.status) {
      if (queryDto.status === 'active') {
        where.status = true;
      } else if (queryDto.status === 'inactive' || queryDto.status === 'suspended') {
        where.status = false;
      }
    }

    if (queryDto.role) {
      where.userRoles = {
        some: {
          role: {
            name: queryDto.role,
          },
        },
      };
    }

    if (queryDto.search) {
      where.OR = [
        { email: { contains: queryDto.search, mode: 'insensitive' } },
        {
          userInfo: {
            OR: [
              { fullName: { contains: queryDto.search, mode: 'insensitive' } },
              { phoneNumber: { contains: queryDto.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          userInfo: true,
          userRoles: {
            include: {
              role: true,
            },
          },
          orders: {
            where: {
              status: 'completed',
              paymentStatus: 'completed',
            },
            select: {
              total: true,
            },
          },
          _count: {
            select: {
              orders: true,
              products: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items: users.map((user) => {
        const userRole =
          user.userRoles.find((ur) => ur.role.name !== 'admin')?.role || user.userRoles[0]?.role;
        const roleName = userRole?.name || 'buyer';

        const totalOrders = user._count.orders;
        const totalRevenue = user.orders.reduce((sum, o) => sum + Number(o.total), 0);

        return {
          id: user.id.toString(),
          name: user.userInfo?.fullName || user.email.split('@')[0],
          email: user.email,
          phone: user.userInfo?.phoneNumber || null,
          role: roleName,
          status: user.status ? 'active' : 'inactive',
          verified: user.isVerified,
          joinDate: new Date(Number(user.createdAt)).toISOString(),
          lastActive: new Date(Number(user.updatedAt)).toISOString(),
          totalOrders,
          totalRevenue,
          rating: 0,
          location: user.userInfo?.address || null,
          avatar: user.userInfo?.avatarUrl || null,
        };
      }),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getUserById(adminId: number, userId: number) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userInfo: true,
        userRoles: {
          include: {
            role: true,
          },
        },
        orders: {
          include: {
            items: true,
          },
        },
        products: true,
        stores: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        message: MESSAGES.ADMIN.USER_NOT_FOUND || 'User not found',
        errorCode: ERROR_CODES.ADMIN_USER_NOT_FOUND || 'USER_NOT_FOUND',
      });
    }

    const userRole =
      user.userRoles.find((ur) => ur.role.name !== 'admin')?.role || user.userRoles[0]?.role;
    const roleName = userRole?.name || 'buyer';

    const totalOrders = user.orders.length;
    const totalRevenue = user.orders
      .filter((o) => o.status === 'completed' && o.paymentStatus === 'completed')
      .reduce((sum, o) => sum + Number(o.total), 0);

    return {
      id: user.id.toString(),
      name: user.userInfo?.fullName || user.email.split('@')[0],
      email: user.email,
      phone: user.userInfo?.phoneNumber || null,
      role: roleName,
      status: user.status ? 'active' : 'inactive',
      verified: user.isVerified,
      joinDate: new Date(Number(user.createdAt)).toISOString(),
      lastActive: new Date(Number(user.updatedAt)).toISOString(),
      totalOrders,
      totalRevenue,
      rating: 0,
      location: user.userInfo?.address || null,
      avatar: user.userInfo?.avatarUrl || null,
    };
  }

  async getUserStatistics(adminId: number) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const [activeUsers, inactiveUsers, verifiedUsers, sellers] = await Promise.all([
      this.prisma.user.count({ where: { status: true } }),
      this.prisma.user.count({ where: { status: false } }),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.user.count({
        where: {
          userRoles: {
            some: {
              role: {
                name: 'seller',
              },
            },
          },
        },
      }),
    ]);

    return {
      active: activeUsers,
      pending: inactiveUsers,
      suspended: inactiveUsers,
      sellers,
      verified: verifiedUsers,
    };
  }

  async approveUser(adminId: number, userId: number) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userInfo: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        message: MESSAGES.ADMIN.USER_NOT_FOUND || 'User not found',
        errorCode: ERROR_CODES.ADMIN_USER_NOT_FOUND || 'USER_NOT_FOUND',
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: true,
        isVerified: true,
        updatedAt: BigInt(Date.now()),
      },
      include: {
        userInfo: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const userRole =
      updated.userRoles.find((ur) => ur.role.name !== 'admin')?.role || updated.userRoles[0]?.role;
    const roleName = userRole?.name || 'buyer';

    return {
      id: updated.id.toString(),
      name: updated.userInfo?.fullName || updated.email.split('@')[0],
      email: updated.email,
      phone: updated.userInfo?.phoneNumber || null,
      role: roleName,
      status: updated.status ? 'active' : 'inactive',
      verified: updated.isVerified,
      joinDate: new Date(Number(updated.createdAt)).toISOString(),
      lastActive: new Date(Number(updated.updatedAt)).toISOString(),
      totalOrders: 0,
      totalRevenue: 0,
      rating: 0,
      location: updated.userInfo?.address || null,
      avatar: updated.userInfo?.avatarUrl || null,
    };
  }

  async suspendUser(adminId: number, userId: number) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        message: MESSAGES.ADMIN.USER_NOT_FOUND || 'User not found',
        errorCode: ERROR_CODES.ADMIN_USER_NOT_FOUND || 'USER_NOT_FOUND',
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: false,
        updatedAt: BigInt(Date.now()),
      },
      include: {
        userInfo: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const userRole =
      updated.userRoles.find((ur) => ur.role.name !== 'admin')?.role || updated.userRoles[0]?.role;
    const roleName = userRole?.name || 'buyer';

    return {
      id: updated.id.toString(),
      name: updated.userInfo?.fullName || updated.email.split('@')[0],
      email: updated.email,
      phone: updated.userInfo?.phoneNumber || null,
      role: roleName,
      status: updated.status ? 'active' : 'inactive',
      verified: updated.isVerified,
      joinDate: new Date(Number(updated.createdAt)).toISOString(),
      lastActive: new Date(Number(updated.updatedAt)).toISOString(),
      totalOrders: 0,
      totalRevenue: 0,
      rating: 0,
      location: updated.userInfo?.address || null,
      avatar: updated.userInfo?.avatarUrl || null,
    };
  }

  async activateUser(adminId: number, userId: number) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        message: MESSAGES.ADMIN.USER_NOT_FOUND || 'User not found',
        errorCode: ERROR_CODES.ADMIN_USER_NOT_FOUND || 'USER_NOT_FOUND',
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: true,
        updatedAt: BigInt(Date.now()),
      },
      include: {
        userInfo: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const userRole =
      updated.userRoles.find((ur) => ur.role.name !== 'admin')?.role || updated.userRoles[0]?.role;
    const roleName = userRole?.name || 'buyer';

    return {
      id: updated.id.toString(),
      name: updated.userInfo?.fullName || updated.email.split('@')[0],
      email: updated.email,
      phone: updated.userInfo?.phoneNumber || null,
      role: roleName,
      status: updated.status ? 'active' : 'inactive',
      verified: updated.isVerified,
      joinDate: new Date(Number(updated.createdAt)).toISOString(),
      lastActive: new Date(Number(updated.updatedAt)).toISOString(),
      totalOrders: 0,
      totalRevenue: 0,
      rating: 0,
      location: updated.userInfo?.address || null,
      avatar: updated.userInfo?.avatarUrl || null,
    };
  }

  async bulkApproveUsers(adminId: number, userIds: number[]) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const result = await this.prisma.user.updateMany({
      where: {
        id: {
          in: userIds,
        },
      },
      data: {
        status: true,
        isVerified: true,
        updatedAt: BigInt(Date.now()),
      },
    });

    return {
      count: result.count,
    };
  }

  async bulkSuspendUsers(adminId: number, userIds: number[]) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const result = await this.prisma.user.updateMany({
      where: {
        id: {
          in: userIds,
        },
      },
      data: {
        status: false,
        updatedAt: BigInt(Date.now()),
      },
    });

    return {
      count: result.count,
    };
  }
}
