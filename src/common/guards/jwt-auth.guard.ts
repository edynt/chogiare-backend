import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CurrentUserPayload } from '../decorators/current-user.decorator';
import { MESSAGES } from '../constants/messages.constants';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly logger: LoggerService,
  ) {
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
      this.logger.warn('JWT authentication error', 'JwtAuthGuard', {
        error: err.message,
        info: info instanceof Error ? info.message : String(info),
      });
      throw err instanceof UnauthorizedException
        ? err
        : new UnauthorizedException(MESSAGES.TOKEN.INVALID_OR_EXPIRED);
    }

    if (!user) {
      this.logger.warn('JWT authentication failed: no user', 'JwtAuthGuard', {
        info: info instanceof Error ? info.message : String(info),
      });
      throw new UnauthorizedException(MESSAGES.TOKEN.INVALID_OR_EXPIRED);
    }

    return user as TUser;
  }
}
