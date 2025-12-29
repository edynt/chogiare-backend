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
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
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

    // First, check if roles are available in the token (for performance)
    let userRoleNames: string[] = [];

    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      // Roles are in the token, use them directly
      userRoleNames = user.roles;
    } else {
      // Roles not in token, fall back to database query (backward compatibility)
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: user.id },
        include: { role: true },
      });
      userRoleNames = userRoles.map((ur) => ur.role.name);
    }

    const hasRole = requiredRoles.some((role) => userRoleNames.includes(role));

    if (!hasRole) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    return true;
  }
}
