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
      if (!(err instanceof UnauthorizedException)) {
        this.logger.error(
          'JWT authentication error',
          err instanceof Error ? err.stack : undefined,
          'JwtAuthGuard',
          {
            error: err.message,
            info: info instanceof Error ? info.message : String(info),
          },
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
