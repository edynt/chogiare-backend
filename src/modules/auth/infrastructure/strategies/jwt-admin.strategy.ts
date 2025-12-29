import {
  Injectable,
  UnauthorizedException,
  Inject,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@modules/auth/domain/repositories/user.repository.interface';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';

export interface JwtAdminPayload {
  sub: number | string;
  email: string;
  roles?: string[];
  tokenType?: string;
  iat?: number;
  exp?: number;
}

// Custom extractor to get admin token from cookie or Authorization header
const adminCookieOrBearerExtractor = (req: Request): string | null => {
  // First try to get from admin cookie
  if (req && req.cookies && req.cookies.adminAccessToken) {
    return req.cookies.adminAccessToken;
  }
  // Fall back to Authorization header
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
};

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  private readonly logger = new Logger(JwtAdminStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {
    const adminSecret = configService.get<string>('jwt.adminSecret');
    if (!adminSecret) {
      throw new Error('JWT_ADMIN_SECRET is not configured');
    }
    super({
      jwtFromRequest: adminCookieOrBearerExtractor,
      ignoreExpiration: false,
      secretOrKey: adminSecret,
    });
  }

  async validate(payload: JwtAdminPayload) {
    try {
      if (!payload || !payload.sub) {
        throw new UnauthorizedException(MESSAGES.TOKEN.INVALID_OR_EXPIRED);
      }

      // Verify this is an admin token
      if (payload.tokenType !== 'admin') {
        throw new ForbiddenException({
          message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
          errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
        });
      }

      // Verify roles include admin
      if (!payload.roles || !payload.roles.includes('admin')) {
        throw new ForbiddenException({
          message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
          errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
        });
      }

      const userId = typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;
      if (isNaN(userId)) {
        throw new UnauthorizedException(MESSAGES.TOKEN.INVALID_OR_EXPIRED);
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UnauthorizedException(MESSAGES.AUTH.USER_DOES_NOT_EXIST);
      }
      if (!user.status) {
        throw new UnauthorizedException(MESSAGES.AUTH.ACCOUNT_IS_LOCKED);
      }

      return {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        status: user.status,
        language: user.language,
        roles: payload.roles,
        tokenType: payload.tokenType,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(
        'Error validating admin JWT token',
        error instanceof Error ? error.stack : undefined,
        JSON.stringify({ payload }),
      );
      throw new UnauthorizedException(MESSAGES.TOKEN.INVALID_OR_EXPIRED);
    }
  }
}
