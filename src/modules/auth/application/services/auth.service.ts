import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@modules/auth/domain/repositories/user.repository.interface';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    isVerified: boolean;
    status: boolean;
    language: string;
  };
  tokens: AuthTokens;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const existingUser = await this.userRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException({
        message: MESSAGES.AUTH.EMAIL_ALREADY_EXISTS,
        errorCode: ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
      });
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.userRepository.create({
      email: registerDto.email,
      hashedPassword,
      isVerified: false,
      status: true,
      language: 'vi',
    });

    const now = BigInt(Date.now());
    await this.prisma.userInfo.create({
      data: {
        userId: user.id,
        fullName: registerDto.fullName,
        createdAt: now,
        updatedAt: now,
      },
    });

    const verificationCode = this.generateVerificationCode();
    const expiresAt = BigInt(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        code: verificationCode,
        expiresAt,
        createdAt: now,
      },
    });

    return {
      message: MESSAGES.AUTH.EMAIL_VERIFICATION_SENT,
      email: user.email,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.INVALID_CREDENTIALS,
        errorCode: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      });
    }

    if (!user.status) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.ACCOUNT_LOCKED,
        errorCode: 'AUTH_ACCOUNT_LOCKED',
      });
    }

    if (!user.isVerified) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.EMAIL_NOT_VERIFIED,
        errorCode: 'AUTH_EMAIL_NOT_VERIFIED',
      });
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.INVALID_CREDENTIALS,
        errorCode: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        status: user.status,
        language: user.language,
      },
      tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const session = await this.prisma.session.findFirst({
        where: {
          refreshToken: refreshTokenDto.refreshToken,
          userId: typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub,
          expiresAt: {
            gt: BigInt(Date.now()),
          },
        },
      });

      if (!session) {
        throw new UnauthorizedException({
          message: MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
          errorCode: ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN,
        });
      }

      const userId = typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;
      const user = await this.userRepository.findById(userId);
      if (!user || !user.status) {
        throw new UnauthorizedException({
          message: MESSAGES.AUTH.USER_NOT_FOUND,
          errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
        });
      }

      const tokens = await this.generateTokens(user.id, user.email);

      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: tokens.refreshToken,
          expiresAt: BigInt(this.getRefreshTokenExpiration()),
        },
      });

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Refresh token error', error instanceof Error ? error.stack : undefined);
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
        errorCode: ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN,
      });
    }
  }

  async logout(userId: number, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.session.deleteMany({
        where: {
          userId,
          refreshToken,
        },
      });
    } else {
      await this.prisma.session.deleteMany({
        where: { userId },
      });
    }
  }

  private async generateTokens(userId: number, email: string): Promise<AuthTokens> {
    const payload = { sub: userId, email };
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '1h';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') || '7d',
      }),
    ]);

    const expiresInSeconds = this.parseExpiresIn(expiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
    };
  }

  private async saveRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const expiresAt = BigInt(this.getRefreshTokenExpiration());

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
        createdAt: BigInt(Date.now()),
      },
    });
  }

  private getRefreshTokenExpiration(): number {
    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    return Date.now() + this.parseExpiresIn(expiresIn) * 1000;
  }

  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 3600;
    }
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async verifyEmail(code: string): Promise<void> {
    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        code,
        expiresAt: {
          gt: BigInt(Date.now()),
        },
      },
      include: {
        user: true,
      },
    });

    if (!verification) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.INVALID_VERIFICATION_CODE,
        errorCode: ERROR_CODES.AUTH_INVALID_VERIFICATION_CODE,
      });
    }

    if (verification.user.isVerified) {
      throw new ConflictException({
        message: MESSAGES.AUTH.EMAIL_ALREADY_VERIFIED,
        errorCode: ERROR_CODES.AUTH_EMAIL_ALREADY_VERIFIED,
      });
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { isVerified: true },
      }),
      this.prisma.emailVerification.deleteMany({
        where: { userId: verification.userId },
      }),
    ]);
  }
}
