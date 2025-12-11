import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';

@Injectable()
export class RolePermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserRoles(userId: number): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map((ur) => ur.role.name);
  }

  async getUserPermissions(userId: number): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();
    userRoles.forEach((userRole) => {
      userRole.role.rolePermissions.forEach((rp) => {
        permissions.add(rp.permission.name);
      });
    });

    return Array.from(permissions);
  }

  async assignRoleToUser(userId: number, roleName: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException({
        message: MESSAGES.NOT_FOUND,
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    const existingUserRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
    });

    if (existingUserRole) {
      throw new ConflictException({
        message: MESSAGES.CONFLICT,
        errorCode: ERROR_CODES.CONFLICT,
      });
    }

    await this.prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
    });
  }

  async removeRoleFromUser(userId: number, roleName: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException({
        message: MESSAGES.NOT_FOUND,
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: role.id,
      },
    });
  }

  async hasRole(userId: number, roleName: string): Promise<boolean> {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return false;
    }

    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
    });

    return !!userRole;
  }

  async hasPermission(userId: number, permissionName: string): Promise<boolean> {
    const permission = await this.prisma.permission.findUnique({
      where: { name: permissionName },
    });

    if (!permission) {
      return false;
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: {
                permissionId: permission.id,
              },
            },
          },
        },
      },
    });

    return userRoles.some((ur) => ur.role.rolePermissions.length > 0);
  }

  async getAllRoles(): Promise<Array<{ id: number; name: string; description: string | null }>> {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
    }));
  }

  async getAllPermissions(): Promise<
    Array<{ id: number; name: string; description: string | null }>
  > {
    const permissions = await this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
    return permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
    }));
  }
}
