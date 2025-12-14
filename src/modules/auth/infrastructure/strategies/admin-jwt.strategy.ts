import { Injectable, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/database/prisma.service';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@modules/auth/domain/repositories/user.repository.interface';
import { MESSAGES } from '@common/constants/messages.constants';

export interface AdminJwtPayload {
  sub: number;
  email: string;
  type?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  private readonly logger = new Logger(AdminJwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('jwt.adminSecret');
    if (!secret) {
      throw new Error('JWT_ADMIN_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: AdminJwtPayload) {
    try {
      if (!payload || !payload.sub) {
        throw new UnauthorizedException(MESSAGES.TOKEN.INVALID_OR_EXPIRED);
      }

      if (payload.type !== 'admin') {
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

      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: user.id },
        include: { role: true },
      });

      const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');
      if (!isAdmin) {
        throw new UnauthorizedException(MESSAGES.USER.INSUFFICIENT_PERMISSIONS);
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
        'Error validating admin JWT token',
        error instanceof Error ? error.stack : undefined,
        JSON.stringify({ payload }),
      );
      throw new UnauthorizedException(MESSAGES.TOKEN.INVALID_OR_EXPIRED);
    }
  }
}

