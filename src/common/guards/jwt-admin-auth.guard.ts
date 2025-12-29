import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CurrentUserPayload } from '../decorators/current-user.decorator';
import { MESSAGES } from '../constants/messages.constants';

@Injectable()
export class JwtAdminAuthGuard extends AuthGuard('jwt-admin') {
  private readonly logger = new Logger(JwtAdminAuthGuard.name);

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
          'Admin JWT authentication error',
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
