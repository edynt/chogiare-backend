import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, isObservable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_ADMIN_AUTH_KEY } from '../decorators/admin-auth.decorator';
import { CurrentUserPayload } from '../decorators/current-user.decorator';
import { MESSAGES } from '../constants/messages.constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip global JWT guard for routes that use admin authentication
    // These routes use JwtAdminAuthGuard which reads from adminAccessToken cookie
    const isAdminAuth = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isAdminAuth) {
      return true;
    }

    if (isPublic) {
      // For public routes, try to validate JWT if present (optional auth)
      // This allows public routes to access user info when available
      try {
        const result = super.canActivate(context);
        // Handle Observable, Promise, or boolean return types
        if (isObservable(result)) {
          await firstValueFrom(result);
        } else {
          await result;
        }
      } catch {
        // Ignore auth errors for public routes - user will just be undefined
      }
      return true;
    }

    const result = super.canActivate(context);
    if (isObservable(result)) {
      return firstValueFrom(result);
    }
    return result;
  }

  handleRequest<TUser = CurrentUserPayload>(
    err: Error | null,
    user: TUser | false,
    info: unknown,
  ): TUser {
    if (err) {
      if (!(err instanceof UnauthorizedException)) {
        this.logger.error(
          'JWT authentication error',
          err instanceof Error ? err.stack : undefined,
          JSON.stringify({
            error: err.message,
            info: info instanceof Error ? info.message : String(info),
          }),
        );
      }
      throw err instanceof UnauthorizedException
        ? err
        : new UnauthorizedException(MESSAGES.TOKEN.INVALID_OR_EXPIRED);
    }

    if (!user) {
      throw new UnauthorizedException(MESSAGES.TOKEN.INVALID_OR_EXPIRED);
    }

    return user as TUser;
  }
}
