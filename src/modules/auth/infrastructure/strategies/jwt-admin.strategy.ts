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
import { ROLE_IDS } from '@common/constants/roles.constants';

export interface JwtAdminPayload {
  sub: number | string;
  email: string;
  roleIds?: number[];
  iat?: number;
  exp?: number;
}

// Custom extractor to get admin token from adminAccessToken cookie or Authorization header
const adminCookieOrBearerExtractor = (req: Request): string | null => {
  // First try to get from admin-specific cookie (adminAccessToken)
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
    // Use unified jwt.secret instead of separate adminSecret
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    super({
      jwtFromRequest: adminCookieOrBearerExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtAdminPayload) {
    try {
      if (!payload || !payload.sub) {
        throw new UnauthorizedException(MESSAGES.TOKEN.INVALID_OR_EXPIRED);
      }

      // Verify roleIds includes admin role
      if (!payload.roleIds || !payload.roleIds.includes(ROLE_IDS.ADMIN)) {
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
        roleIds: payload.roleIds,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(
        'Error validating admin JWT token',
        error instanceof Error ? error.stack : undefined,
      );
      throw new UnauthorizedException(MESSAGES.TOKEN.INVALID_OR_EXPIRED);
    }
  }
}
