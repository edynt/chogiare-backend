import { Injectable, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@modules/auth/domain/repositories/user.repository.interface';
import { MESSAGES } from '@common/constants/messages.constants';

export interface JwtPayload {
  sub: number | string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    try {
      if (!payload || !payload.sub) {
        throw new UnauthorizedException(MESSAGES.TOKEN.INVALID_OR_EXPIRED);
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
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        'Error validating JWT token',
        error instanceof Error ? error.stack : undefined,
        JSON.stringify({ payload }),
      );
      throw new UnauthorizedException(MESSAGES.TOKEN.INVALID_OR_EXPIRED);
    }
  }
}
