import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { isAdmin } from '@common/utils/admin.utils';
import { QueryAdminUserDto } from '../dto/query-admin-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateUserRolesDto } from '../dto/update-user-roles.dto';
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

    if (queryDto.status && !queryDto.role) {
      if (queryDto.status === 'active') {
        where.status = true;
      } else if (queryDto.status === 'inactive') {
        where.status = false;
      }
    }

    // Role filter with admin exclusion (shows both active and inactive users)
    if (queryDto.role) {
      where.AND = [
        {
          userRoles: {
            some: {
              role: {
                name: queryDto.role,
              },
            },
          },
        },
        {
          // Exclude admins
          NOT: {
            userRoles: {
              some: {
                role: {
                  name: 'admin',
                },
              },
            },
          },
        },
      ];
    } else {
      // No role filter - exclude admins by default
      where.NOT = {
        userRoles: {
          some: {
            role: {
              name: 'admin',
            },
          },
        },
      };
    }

    // Search filter
    if (queryDto.search) {
      const searchCondition: Prisma.UserWhereInput = {
        OR: [
          { email: { contains: queryDto.search, mode: 'insensitive' as const } },
          {
            userInfo: {
              OR: [
                { fullName: { contains: queryDto.search, mode: 'insensitive' as const } },
                { phoneNumber: { contains: queryDto.search, mode: 'insensitive' as const } },
              ],
            },
          },
        ],
      };

      // Merge with existing where conditions
      if (where.OR || where.AND) {
        const existingAND = Array.isArray(where.AND) ? where.AND : [];
        if (where.OR) {
          existingAND.push({ OR: where.OR });
          delete where.OR;
        }
        existingAND.push(searchCondition);
        where.AND = existingAND;
      } else {
        where.AND = [searchCondition];
      }
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
        // Simplified - admins already excluded at DB level
        const userRole = user.userRoles[0]?.role;
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
      inactive: inactiveUsers,
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

  async deleteUser(adminId: number, userId: number) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    // Prevent self-deletion
    if (adminId === userId) {
      throw new BadRequestException({
        message: 'Cannot delete your own account',
        errorCode: 'CANNOT_DELETE_SELF',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
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

    // Prevent deleting other admins
    const isTargetAdmin = user.userRoles.some((ur) => ur.role.name === 'admin');
    if (isTargetAdmin) {
      throw new BadRequestException({
        message: 'Cannot delete admin users',
        errorCode: 'CANNOT_DELETE_ADMIN',
      });
    }

    // Check for blocking constraints (Restrict policies)
    const [orderCount, transactionCount, productBoostCount] = await Promise.all([
      this.prisma.order.count({ where: { userId } }),
      this.prisma.transaction.count({ where: { userId } }),
      this.prisma.productBoost.count({ where: { userId } }),
    ]);

    if (orderCount > 0) {
      throw new BadRequestException({
        message: `Cannot delete user with ${orderCount} order(s). Consider suspending the account instead.`,
        errorCode: 'USER_HAS_ORDERS',
      });
    }

    if (transactionCount > 0) {
      throw new BadRequestException({
        message: `Cannot delete user with ${transactionCount} transaction(s).`,
        errorCode: 'USER_HAS_TRANSACTIONS',
      });
    }

    if (productBoostCount > 0) {
      throw new BadRequestException({
        message: `Cannot delete user with ${productBoostCount} active product boost(s).`,
        errorCode: 'USER_HAS_BOOSTS',
      });
    }

    // Delete user and ALL related data in transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Delete stores and their products
      const stores = await tx.store.findMany({
        where: { userId },
        select: { id: true },
      });

      for (const store of stores) {
        // Delete product images first
        const products = await tx.product.findMany({
          where: { storeId: store.id },
          select: { id: true },
        });

        for (const product of products) {
          await tx.productImage.deleteMany({ where: { productId: product.id } });
        }

        // Delete products in the store
        await tx.product.deleteMany({ where: { storeId: store.id } });
      }

      // Delete stores
      await tx.store.deleteMany({ where: { userId } });

      // 2. Delete products without stores (sellerId reference)
      const sellerProducts = await tx.product.findMany({
        where: { sellerId: userId },
        select: { id: true },
      });

      for (const product of sellerProducts) {
        await tx.productImage.deleteMany({ where: { productId: product.id } });
      }

      await tx.product.deleteMany({ where: { sellerId: userId } });

      // 3. Delete chat/conversation data
      await tx.chatMessage.deleteMany({ where: { senderId: userId } });
      await tx.conversationParticipant.deleteMany({ where: { userId } });

      // 4. Delete support tickets and replies
      await tx.ticketReply.deleteMany({ where: { userId } });
      await tx.supportTicket.deleteMany({ where: { userId } });
      // Clear assignedTo references (SetNull)
      await tx.supportTicket.updateMany({
        where: { assignedTo: userId },
        data: { assignedTo: null },
      });

      // 5. Delete user balance
      await tx.userBalance.deleteMany({ where: { userId } });

      // 6. Delete auth-related data
      await tx.session.deleteMany({ where: { userId } });
      await tx.emailVerification.deleteMany({ where: { userId } });
      await tx.passwordReset.deleteMany({ where: { userId } });

      // 7. Delete user roles
      await tx.userRole.deleteMany({ where: { userId } });

      // 8. Delete user info
      await tx.userInfo.deleteMany({ where: { userId } });

      // 9. Delete cart and items
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.delete({ where: { userId } });
      }

      // 10. Delete addresses
      await tx.address.deleteMany({ where: { userId } });

      // 11. Delete reviews
      await tx.review.deleteMany({ where: { userId } });

      // 12. Delete notifications
      await tx.notification.deleteMany({ where: { userId } });

      // 13. Delete stock alerts
      await tx.stockAlert.deleteMany({ where: { userId } });

      // 14. Delete the user (final step)
      await tx.user.delete({ where: { id: userId } });
    });

    return { success: true };
  }

  async updateUser(adminId: number, userId: number, updateDto: UpdateUserDto) {
    // Check if the requester is an admin
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    // Check if the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userInfo: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        message: MESSAGES.ADMIN.USER_NOT_FOUND || 'User not found',
        errorCode: ERROR_CODES.ADMIN_USER_NOT_FOUND || 'USER_NOT_FOUND',
      });
    }

    // Prepare update data - only include provided fields
    const updateData: any = {};
    if (updateDto.fullName !== undefined) updateData.fullName = updateDto.fullName;
    if (updateDto.phoneNumber !== undefined) updateData.phoneNumber = updateDto.phoneNumber;
    if (updateDto.address !== undefined) updateData.address = updateDto.address;
    if (updateDto.gender !== undefined) updateData.gender = updateDto.gender;
    if (updateDto.dateOfBirth !== undefined) updateData.dateOfBirth = updateDto.dateOfBirth;
    if (updateDto.country !== undefined) updateData.country = updateDto.country;

    // Update or create userInfo
    if (Object.keys(updateData).length > 0) {
      if (user.userInfo) {
        // Update existing userInfo
        await this.prisma.userInfo.update({
          where: { userId },
          data: {
            ...updateData,
            updatedAt: BigInt(Date.now()),
          },
        });
      } else {
        // Create new userInfo
        await this.prisma.userInfo.create({
          data: {
            userId,
            ...updateData,
            createdAt: BigInt(Date.now()),
            updatedAt: BigInt(Date.now()),
          },
        });
      }
    }

    // Update user's updatedAt timestamp
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        updatedAt: BigInt(Date.now()),
      },
    });

    // Return updated user data
    return this.getUserById(adminId, userId);
  }

  async updateUserRoles(adminId: number, userId: number, updateDto: UpdateUserRolesDto) {
    // Check if the requester is an admin
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    // Check if the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
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

    // Prevent admin from modifying their own roles
    if (user.id === adminId) {
      throw new BadRequestException({
        message: 'Cannot modify your own roles',
        errorCode: 'CANNOT_MODIFY_OWN_ROLES',
      });
    }

    // Verify all role IDs exist
    const roles = await this.prisma.role.findMany({
      where: {
        id: {
          in: updateDto.roleIds,
        },
      },
    });

    if (roles.length !== updateDto.roleIds.length) {
      throw new BadRequestException({
        message: 'One or more role IDs are invalid',
        errorCode: 'INVALID_ROLE_IDS',
      });
    }

    // Check if trying to assign admin role to another user
    const hasAdminRole = roles.some((role) => role.name === 'admin');
    if (hasAdminRole && user.id !== adminId) {
      throw new BadRequestException({
        message: 'Cannot assign admin role to other users',
        errorCode: 'CANNOT_ASSIGN_ADMIN_ROLE',
      });
    }

    // Delete existing user roles and create new ones
    await this.prisma.$transaction(async (tx) => {
      // Delete existing roles
      await tx.userRole.deleteMany({
        where: { userId },
      });

      // Create new roles
      await tx.userRole.createMany({
        data: updateDto.roleIds.map((roleId) => ({
          userId,
          roleId,
          createdAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
        })),
      });

      // Update user's updatedAt timestamp
      await tx.user.update({
        where: { id: userId },
        data: {
          updatedAt: BigInt(Date.now()),
        },
      });
    });

    // Return updated user data
    return this.getUserById(adminId, userId);
  }
}
