import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { ORDER_STATUS, PAYMENT_STATUS } from '@common/constants/enum.constants';
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
          { fullName: { contains: queryDto.search, mode: 'insensitive' as const } },
          { phoneNumber: { contains: queryDto.search, mode: 'insensitive' as const } },
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
          userRoles: {
            include: {
              role: true,
            },
          },
          buyerOrders: {
            where: {
              status: ORDER_STATUS.COMPLETED,
              paymentStatus: PAYMENT_STATUS.COMPLETED,
            },
            select: {
              total: true,
            },
          },
          _count: {
            select: {
              buyerOrders: true,
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
        const roleName = userRole?.name || 'user';

        const totalOrders = user._count.buyerOrders;
        const totalRevenue = user.buyerOrders.reduce((sum, o) => sum + Number(o.total), 0);

        return {
          id: user.id.toString(),
          name: user.fullName || user.email.split('@')[0],
          email: user.email,
          phone: user.phoneNumber || null,
          role: roleName,
          status: user.status ? 'active' : 'inactive',
          verified: user.isVerified,
          joinDate: new Date(Number(user.createdAt)).toISOString(),
          lastActive: new Date(Number(user.updatedAt)).toISOString(),
          totalOrders,
          totalRevenue,
          rating: 0,
          location: user.address || null,
          avatar: user.avatarUrl || null,
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
        userRoles: {
          include: {
            role: true,
          },
        },
        buyerOrders: {
          include: {
            items: true,
          },
        },
        products: true,
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
    const roleName = userRole?.name || 'user';

    const totalOrders = user.buyerOrders.length;
    const totalRevenue = user.buyerOrders
      .filter((o) => o.status === ORDER_STATUS.COMPLETED && o.paymentStatus === PAYMENT_STATUS.COMPLETED)
      .reduce((sum, o) => sum + Number(o.total), 0);

    return {
      id: user.id.toString(),
      name: user.fullName || user.email.split('@')[0],
      email: user.email,
      phone: user.phoneNumber || null,
      role: roleName,
      status: user.status ? 'active' : 'inactive',
      verified: user.isVerified,
      joinDate: new Date(Number(user.createdAt)).toISOString(),
      lastActive: new Date(Number(user.updatedAt)).toISOString(),
      totalOrders,
      totalRevenue,
      rating: 0,
      location: user.address || null,
      avatar: user.avatarUrl || null,
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

    const [activeUsers, inactiveUsers, verifiedUsers] = await Promise.all([
      this.prisma.user.count({ where: { status: true } }),
      this.prisma.user.count({ where: { status: false } }),
      this.prisma.user.count({ where: { isVerified: true } }),
    ]);

    return {
      active: activeUsers,
      inactive: inactiveUsers,
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
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const userRole =
      updated.userRoles.find((ur) => ur.role.name !== 'admin')?.role || updated.userRoles[0]?.role;
    const roleName = userRole?.name || 'user';

    return {
      id: updated.id.toString(),
      name: updated.fullName || updated.email.split('@')[0],
      email: updated.email,
      phone: updated.phoneNumber || null,
      role: roleName,
      status: updated.status ? 'active' : 'inactive',
      verified: updated.isVerified,
      joinDate: new Date(Number(updated.createdAt)).toISOString(),
      lastActive: new Date(Number(updated.updatedAt)).toISOString(),
      totalOrders: 0,
      totalRevenue: 0,
      rating: 0,
      location: updated.address || null,
      avatar: updated.avatarUrl || null,
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
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const userRole =
      updated.userRoles.find((ur) => ur.role.name !== 'admin')?.role || updated.userRoles[0]?.role;
    const roleName = userRole?.name || 'user';

    return {
      id: updated.id.toString(),
      name: updated.fullName || updated.email.split('@')[0],
      email: updated.email,
      phone: updated.phoneNumber || null,
      role: roleName,
      status: updated.status ? 'active' : 'inactive',
      verified: updated.isVerified,
      joinDate: new Date(Number(updated.createdAt)).toISOString(),
      lastActive: new Date(Number(updated.updatedAt)).toISOString(),
      totalOrders: 0,
      totalRevenue: 0,
      rating: 0,
      location: updated.address || null,
      avatar: updated.avatarUrl || null,
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
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const userRole =
      updated.userRoles.find((ur) => ur.role.name !== 'admin')?.role || updated.userRoles[0]?.role;
    const roleName = userRole?.name || 'user';

    return {
      id: updated.id.toString(),
      name: updated.fullName || updated.email.split('@')[0],
      email: updated.email,
      phone: updated.phoneNumber || null,
      role: roleName,
      status: updated.status ? 'active' : 'inactive',
      verified: updated.isVerified,
      joinDate: new Date(Number(updated.createdAt)).toISOString(),
      lastActive: new Date(Number(updated.updatedAt)).toISOString(),
      totalOrders: 0,
      totalRevenue: 0,
      rating: 0,
      location: updated.address || null,
      avatar: updated.avatarUrl || null,
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
    const [orderCount, transactionCount] = await Promise.all([
      this.prisma.order.count({ where: { buyerId: userId } }),
      this.prisma.transaction.count({ where: { userId } }),
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

    // Delete user and ALL related data in transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Delete products owned by this seller
      const sellerProducts = await tx.product.findMany({
        where: { sellerId: userId },
        select: { id: true },
      });

      for (const product of sellerProducts) {
        await tx.productImage.deleteMany({ where: { productId: product.id } });
      }

      await tx.product.deleteMany({ where: { sellerId: userId } });

      // 2. Delete chat/conversation data
      await tx.chatMessage.deleteMany({ where: { senderId: userId } });
      await tx.conversationParticipant.deleteMany({ where: { userId } });

      // 3. Delete support tickets and replies
      await tx.ticketReply.deleteMany({ where: { userId } });
      await tx.supportTicket.deleteMany({ where: { userId } });
      // Clear assignedTo references (SetNull)
      await tx.supportTicket.updateMany({
        where: { assignedTo: userId },
        data: { assignedTo: null },
      });

      // 4. Delete user balance
      await tx.userBalance.deleteMany({ where: { userId } });

      // 5. Delete auth-related data
      await tx.session.deleteMany({ where: { userId } });
      await tx.emailVerification.deleteMany({ where: { userId } });
      await tx.passwordReset.deleteMany({ where: { userId } });

      // 6. Delete user roles
      await tx.userRole.deleteMany({ where: { userId } });

      // 7. Delete cart and items
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.delete({ where: { userId } });
      }

      // 8. Delete addresses
      await tx.address.deleteMany({ where: { userId } });

      // 9. Delete reviews
      await tx.review.deleteMany({ where: { userId } });

      // 10. Delete notifications
      await tx.notification.deleteMany({ where: { userId } });

      // 11. Delete the user (final step)
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
      include: {},
    });

    if (!user) {
      throw new NotFoundException({
        message: MESSAGES.ADMIN.USER_NOT_FOUND || 'User not found',
        errorCode: ERROR_CODES.ADMIN_USER_NOT_FOUND || 'USER_NOT_FOUND',
      });
    }

    // Prepare update data - only include provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: BigInt(Date.now()),
    };
    if (updateDto.fullName !== undefined) updateData.fullName = updateDto.fullName;
    if (updateDto.phoneNumber !== undefined) updateData.phoneNumber = updateDto.phoneNumber;
    if (updateDto.address !== undefined) updateData.address = updateDto.address;
    if (updateDto.gender !== undefined) updateData.gender = updateDto.gender;
    if (updateDto.dateOfBirth !== undefined) updateData.dateOfBirth = updateDto.dateOfBirth;
    if (updateDto.country !== undefined) updateData.country = updateDto.country;

    // Update user with profile fields
    if (Object.keys(updateData).length > 1) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

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
