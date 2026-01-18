import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
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

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Skip global JWT guard for routes that use admin authentication
    // These routes use JwtAdminAuthGuard which reads from adminAccessToken cookie
    const isAdminAuth = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isAdminAuth) {
      return true;
    }

    return super.canActivate(context);
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
