import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../database/prisma.service';
import { MESSAGES } from '../constants/messages.constants';
import { ERROR_CODES } from '../constants/error-codes.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Accepts numeric roleIds (1=admin, 2=user, 3=seller) - converted from strings by decorator
    const requiredRoles = this.reflector.getAllAndOverride<(number | string)[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException({
        message: MESSAGES.FORBIDDEN,
        errorCode: ERROR_CODES.FORBIDDEN,
      });
    }

    // Get user roleIds - prefer from token, fallback to DB
    let userRoleIds: number[] = [];

    if (user.roleIds && Array.isArray(user.roleIds) && user.roleIds.length > 0) {
      // RoleIds are in the token, use them directly
      userRoleIds = user.roleIds;
    } else {
      // RoleIds not in token, fall back to database query (backward compatibility)
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: user.id },
      });
      userRoleIds = userRoles.map((ur) => ur.roleId);
    }

    // Check if user has any of the required roles (all should be numbers now after decorator conversion)
    const hasRole = requiredRoles.some((role) => {
      const roleId = typeof role === 'number' ? role : parseInt(role, 10);
      return !isNaN(roleId) && userRoleIds.includes(roleId);
    });

    if (!hasRole) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    return true;
  }
}
