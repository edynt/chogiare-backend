import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@modules/auth/domain/repositories/user.repository.interface';
import { PrismaService } from '@common/database/prisma.service';
import { LoggerService } from '@common/logger/logger.service';
import { MESSAGES } from '@common/constants/messages.constants';
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
    username?: string;
    isVerified: boolean;
    status: boolean;
    language: string;
  };
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(registerDto.email);
    if (existingUser) {
      this.logger.warn(
        `Registration attempt with existing email: ${registerDto.email}`,
        'AuthService',
      );
      throw new ConflictException(MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    // Check username if provided
    if (registerDto.username) {
      const existingUsername = await this.userRepository.findByUsername(
        registerDto.username,
      );
      if (existingUsername) {
        this.logger.warn(
          `Registration attempt with existing username: ${registerDto.username}`,
          'AuthService',
        );
        throw new ConflictException(MESSAGES.AUTH.USERNAME_ALREADY_EXISTS);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = await this.userRepository.create({
      email: registerDto.email,
      username: registerDto.username,
      hashedPassword,
      isVerified: false,
      status: true,
      language: 'vi',
    });

    this.logger.log(`New user registered: ${user.id}`, 'AuthService', {
      userId: user.id,
      email: user.email,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        status: user.status,
        language: user.language,
      },
      tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // Find user by email
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      this.logger.warn(
        `Login attempt with non-existent email: ${loginDto.email}`,
        'AuthService',
      );
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.status) {
      this.logger.warn(`Login attempt with locked account: ${user.id}`, 'AuthService');
      throw new UnauthorizedException(MESSAGES.AUTH.ACCOUNT_LOCKED);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.hashedPassword,
    );
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password attempt for user: ${user.id}`, 'AuthService');
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    this.logger.log(`User logged in: ${user.id}`, 'AuthService', {
      userId: user.id,
      email: user.email,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        status: user.status,
        language: user.language,
      },
      tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(
        refreshTokenDto.refreshToken,
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        },
      );

      // Check if refresh token exists in database
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
        this.logger.warn(
          `Invalid refresh token attempt for user: ${payload.sub}`,
          'AuthService',
        );
        throw new UnauthorizedException(MESSAGES.AUTH.INVALID_REFRESH_TOKEN);
      }

      // Get user
      const userId = typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;
      const user = await this.userRepository.findById(userId);
      if (!user || !user.status) {
        throw new UnauthorizedException(MESSAGES.AUTH.USER_NOT_FOUND);
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email);

      // Update refresh token in database
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: tokens.refreshToken,
          expiresAt: BigInt(this.getRefreshTokenExpiration()),
        },
      });

      this.logger.log(`Token refreshed for user: ${user.id}`, 'AuthService');

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        'Refresh token error',
        error instanceof Error ? error.stack : undefined,
        'AuthService',
      );
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_REFRESH_TOKEN);
    }
  }

  async logout(userId: number, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Delete specific session
      await this.prisma.session.deleteMany({
        where: {
          userId,
          refreshToken,
        },
      });
    } else {
      // Delete all sessions for user
      await this.prisma.session.deleteMany({
        where: { userId },
      });
    }

    this.logger.log(`User logged out: ${userId}`, 'AuthService');
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

    // Calculate expires in seconds
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
        return 3600; // Default 1 hour
    }
  }
}
