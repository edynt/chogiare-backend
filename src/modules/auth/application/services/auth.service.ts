import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@modules/auth/domain/repositories/user.repository.interface';
import { PrismaService } from '@common/database/prisma.service';
import { EmailService } from '@common/services/email.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { ROLE_IDS } from '@common/constants/roles.constants';
import { LANGUAGE } from '@common/constants/enum.constants';
import { Prisma } from '@prisma/client';
import { LoginDto } from '../dto/login.dto';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

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
    language: number;
  };
  tokens: AuthTokens;
  roles?: string[];
  roleIds?: number[]; // Numeric role IDs: 1=admin, 2=user
  permissions?: string[];
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
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
    private readonly emailService: EmailService,
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
      language: LANGUAGE.VI,
      fullName: registerDto.fullName,
    });

    const verificationCode = this.generateVerificationCode();
    const expiresAt = BigInt(Date.now() + 24 * 60 * 60 * 1000);
    const now = BigInt(Date.now());

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        code: verificationCode,
        expiresAt,
        createdAt: now,
      },
    });

    // Fire-and-forget: send email in background so API responds immediately
    this.emailService
      .sendOTPEmail(user.email, registerDto.fullName, verificationCode)
      .catch((error) => {
        this.logger.error(
          'Failed to send OTP email',
          error instanceof Error ? error.stack : undefined,
        );
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

    // Fetch user roles to include in token
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true },
    });

    // Reject admin users from regular login - they must use admin login
    const isAdmin = userRoles.some((ur) => ur.roleId === ROLE_IDS.ADMIN);
    if (isAdmin) {
      throw new UnauthorizedException({
        message: 'Admin users must use the admin login page',
        errorCode: 'AUTH_USE_ADMIN_LOGIN',
      });
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      userRoles.map((ur) => ur.roleId),
    );

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // Track last login time for inactive account cleanup
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: BigInt(Date.now()) },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        status: user.status,
        language: user.language,
      },
      tokens,
      roles: userRoles.map((ur) => ur.role.name),
      roleIds: userRoles.map((ur) => ur.roleId),
    };
  }

  async adminLogin(adminLoginDto: AdminLoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(adminLoginDto.email);
    if (!user) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.INVALID_CREDENTIALS,
        errorCode: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      });
    }

    if (!user.status) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.ACCOUNT_LOCKED,
        errorCode: ERROR_CODES.AUTH_ACCOUNT_LOCKED,
      });
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true },
    });

    // Require admin role, reject user role
    const isAdmin = userRoles.some((ur) => ur.roleId === ROLE_IDS.ADMIN);
    if (!isAdmin) {
      throw new UnauthorizedException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const isPasswordValid = await bcrypt.compare(adminLoginDto.password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.INVALID_CREDENTIALS,
        errorCode: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      });
    }

    // Use unified token generation with roleIds
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      userRoles.map((ur) => ur.roleId),
    );

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // Track last login time
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: BigInt(Date.now()) },
    });

    const permissions = await this.getUserPermissions(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        status: user.status,
        language: user.language,
      },
      tokens,
      roles: userRoles.map((ur) => ur.role.name),
      roleIds: userRoles.map((ur) => ur.roleId),
      permissions,
    };
  }

  private async getUserPermissions(userId: number): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();
    userRoles.forEach((userRole) => {
      userRole.role.rolePermissions.forEach((rp) => {
        permissions.add(rp.permission.name);
      });
    });

    return Array.from(permissions);
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

      // Fetch user roles to include in new access token
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: user.id },
      });

      const tokens = await this.generateTokens(
        user.id,
        user.email,
        userRoles.map((ur) => ur.roleId),
      );

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

  private async generateTokens(
    userId: number,
    email: string,
    roleIds?: number[],
  ): Promise<AuthTokens> {
    const payload: { sub: number; email: string; roleIds?: number[] } = {
      sub: userId,
      email,
    };

    // Include roleIds in payload if provided (1=admin, 2=user)
    if (roleIds && roleIds.length > 0) {
      payload.roleIds = roleIds;
    }

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

  async verifyEmail(code: string): Promise<AuthResponse> {
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

    const user = await this.userRepository.findById(verification.userId);
    if (!user || !user.status) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.USER_NOT_FOUND,
        errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      // Mark user as verified
      await tx.user.update({
        where: { id: verification.userId },
        data: { isVerified: true },
      });

      // Delete verification code
      await tx.emailVerification.deleteMany({
        where: { userId: verification.userId },
      });

      // Add user to user_roles with role_id = 2 (USER role)
      // Use upsert to make it idempotent (safe to run multiple times)
      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: verification.userId,
            roleId: ROLE_IDS.USER, // 2 = USER role
          },
        },
        create: {
          userId: verification.userId,
          roleId: ROLE_IDS.USER,
        },
        update: {}, // No-op if already exists
      });
    });

    const updatedUser = await this.userRepository.findById(verification.userId);
    if (!updatedUser) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.USER_NOT_FOUND,
        errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    }

    // Fetch user roles to include in token
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: updatedUser.id },
      include: { role: true },
    });

    const tokens = await this.generateTokens(
      updatedUser.id,
      updatedUser.email,
      userRoles.map((ur) => ur.roleId),
    );
    await this.saveRefreshToken(updatedUser.id, tokens.refreshToken);

    // Track last login time
    await this.prisma.user.update({
      where: { id: updatedUser.id },
      data: { lastLoginAt: BigInt(Date.now()) },
    });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isVerified: updatedUser.isVerified,
        status: updatedUser.status,
        language: updatedUser.language,
      },
      tokens,
      roles: userRoles.map((ur) => ur.role.name),
      roleIds: userRoles.map((ur) => ur.roleId),
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    const user = await this.userRepository.findByEmail(forgotPasswordDto.email);
    if (!user) {
      return {
        message: MESSAGES.AUTH.PASSWORD_RESET_EMAIL_SENT,
      };
    }

    if (!user.status) {
      return {
        message: MESSAGES.AUTH.PASSWORD_RESET_EMAIL_SENT,
      };
    }

    const resetToken = await this.generateResetToken();
    const expiresAt = BigInt(Date.now() + 60 * 60 * 1000);
    const now = BigInt(Date.now());

    await this.prisma.$transaction([
      this.prisma.passwordReset.deleteMany({
        where: { userId: user.id },
      }),
      this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          resetToken,
          expiresAt,
          createdAt: now,
        },
      }),
    ]);

    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.fullName || 'Người dùng',
        resetToken,
      );
    } catch (error) {
      this.logger.error(
        'Failed to send password reset email',
        error instanceof Error ? error.stack : undefined,
      );
    }

    return {
      message: MESSAGES.AUTH.PASSWORD_RESET_EMAIL_SENT,
    };
  }

  async verifyResetToken(token: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      if (payload.type !== 'password-reset') {
        return {
          valid: false,
          message: MESSAGES.AUTH.INVALID_RESET_TOKEN,
        };
      }
    } catch (error) {
      return {
        valid: false,
        message: MESSAGES.AUTH.INVALID_RESET_TOKEN,
      };
    }

    const passwordReset = await this.prisma.passwordReset.findFirst({
      where: {
        resetToken: token,
        expiresAt: {
          gt: BigInt(Date.now()),
        },
      },
      include: {
        user: true,
      },
    });

    if (!passwordReset) {
      return {
        valid: false,
        message: MESSAGES.AUTH.INVALID_RESET_TOKEN,
      };
    }

    if (passwordReset.used) {
      return {
        valid: false,
        message: MESSAGES.AUTH.RESET_TOKEN_ALREADY_USED,
      };
    }

    if (!passwordReset.user.status) {
      return {
        valid: false,
        message: MESSAGES.AUTH.ACCOUNT_LOCKED,
      };
    }

    return {
      valid: true,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync(resetPasswordDto.resetToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      if (payload.type !== 'password-reset') {
        throw new UnauthorizedException({
          message: MESSAGES.AUTH.INVALID_RESET_TOKEN,
          errorCode: ERROR_CODES.AUTH_INVALID_RESET_TOKEN,
        });
      }
    } catch (error) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.INVALID_RESET_TOKEN,
        errorCode: ERROR_CODES.AUTH_INVALID_RESET_TOKEN,
      });
    }

    const passwordReset = await this.prisma.passwordReset.findFirst({
      where: {
        resetToken: resetPasswordDto.resetToken,
        expiresAt: {
          gt: BigInt(Date.now()),
        },
      },
      include: {
        user: true,
      },
    });

    if (!passwordReset) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.INVALID_RESET_TOKEN,
        errorCode: ERROR_CODES.AUTH_INVALID_RESET_TOKEN,
      });
    }

    if (passwordReset.used) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.RESET_TOKEN_ALREADY_USED,
        errorCode: ERROR_CODES.AUTH_RESET_TOKEN_ALREADY_USED,
      });
    }

    if (!passwordReset.user.status) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.ACCOUNT_LOCKED,
        errorCode: ERROR_CODES.AUTH_ACCOUNT_LOCKED,
      });
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: passwordReset.userId },
        data: { hashedPassword },
      }),
      this.prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
      }),
      this.prisma.session.deleteMany({
        where: { userId: passwordReset.userId },
      }),
    ]);
  }

  private async generateResetToken(): Promise<string> {
    const payload = {
      sub: Date.now().toString(),
      type: 'password-reset',
    };
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: '1h',
    });
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        message: MESSAGES.AUTH.USER_NOT_FOUND,
        errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    }

    if (!user.status) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.ACCOUNT_LOCKED,
        errorCode: ERROR_CODES.AUTH_ACCOUNT_LOCKED,
      });
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.hashedPassword,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.INVALID_CREDENTIALS,
        errorCode: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      });
    }

    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException({
        message: MESSAGES.AUTH.NEW_PASSWORD_SAME_AS_OLD,
        errorCode: ERROR_CODES.AUTH_NEW_PASSWORD_SAME_AS_OLD,
      });
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.userRepository.update(userId, { hashedPassword });

    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return;
    }

    if (user.isVerified) {
      throw new ConflictException({
        message: MESSAGES.AUTH.EMAIL_ALREADY_VERIFIED,
        errorCode: ERROR_CODES.AUTH_EMAIL_ALREADY_VERIFIED,
      });
    }

    if (!user.status) {
      return;
    }

    const verificationCode = this.generateVerificationCode();
    const expiresAt = BigInt(Date.now() + 24 * 60 * 60 * 1000);
    const now = BigInt(Date.now());

    await this.prisma.$transaction([
      this.prisma.emailVerification.deleteMany({
        where: { userId: user.id },
      }),
      this.prisma.emailVerification.create({
        data: {
          userId: user.id,
          code: verificationCode,
          expiresAt,
          createdAt: now,
        },
      }),
    ]);

    try {
      await this.emailService.sendOTPEmail(
        user.email,
        user.fullName || 'Người dùng',
        verificationCode,
      );
    } catch (error) {
      this.logger.error(
        'Failed to send OTP email',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        message: MESSAGES.AUTH.USER_NOT_FOUND,
        errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    }

    if (!user.status) {
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.ACCOUNT_LOCKED,
        errorCode: ERROR_CODES.AUTH_ACCOUNT_LOCKED,
      });
    }

    const now = BigInt(Date.now());
    const updateData: {
      fullName?: string;
      phoneNumber?: string;
      avatarUrl?: string;
      gender?: string;
      dateOfBirth?: string;
      address?: string;
      country?: string;
      metadata?: Record<string, unknown>;
      updatedAt: bigint;
    } = {
      updatedAt: now,
    };

    if (updateProfileDto.fullName !== undefined) {
      updateData.fullName = updateProfileDto.fullName;
    }
    if (updateProfileDto.phoneNumber !== undefined) {
      updateData.phoneNumber = updateProfileDto.phoneNumber;
    }
    if (updateProfileDto.avatarUrl !== undefined) {
      updateData.avatarUrl = updateProfileDto.avatarUrl;
    }
    if (updateProfileDto.gender !== undefined) {
      updateData.gender = updateProfileDto.gender;
    }
    if (updateProfileDto.dateOfBirth !== undefined) {
      updateData.dateOfBirth = updateProfileDto.dateOfBirth;
    }
    if (updateProfileDto.address !== undefined) {
      updateData.address = updateProfileDto.address;
    }
    if (updateProfileDto.country !== undefined) {
      updateData.country = updateProfileDto.country;
    }

    const currentMetadata = (user.profileMetadata as Record<string, unknown>) || {};
    const metadataUpdate: Record<string, unknown> = {};
    if (updateProfileDto.showEmail !== undefined) {
      metadataUpdate.showEmail = updateProfileDto.showEmail;
    }
    if (updateProfileDto.showPhone !== undefined) {
      metadataUpdate.showPhone = updateProfileDto.showPhone;
    }

    const prismaData: {
      fullName?: string;
      phoneNumber?: string;
      avatarUrl?: string;
      gender?: string;
      dateOfBirth?: string;
      address?: string;
      country?: string;
      profileMetadata?: Prisma.InputJsonValue;
      updatedAt: bigint;
    } = {
      updatedAt: now,
    };

    if (updateData.fullName !== undefined) {
      prismaData.fullName = updateData.fullName;
    }
    if (updateData.phoneNumber !== undefined) {
      prismaData.phoneNumber = updateData.phoneNumber;
    }
    if (updateData.avatarUrl !== undefined) {
      prismaData.avatarUrl = updateData.avatarUrl;
    }
    if (updateData.gender !== undefined) {
      prismaData.gender = updateData.gender;
    }
    if (updateData.dateOfBirth !== undefined) {
      prismaData.dateOfBirth = updateData.dateOfBirth;
    }
    if (updateData.address !== undefined) {
      prismaData.address = updateData.address;
    }
    if (updateData.country !== undefined) {
      prismaData.country = updateData.country;
    }

    if (Object.keys(metadataUpdate).length > 0) {
      prismaData.profileMetadata = {
        ...currentMetadata,
        ...metadataUpdate,
      } as Prisma.InputJsonValue;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: prismaData,
    });

    if (updateProfileDto.language !== undefined) {
      const languageNum =
        typeof updateProfileDto.language === 'string'
          ? parseInt(updateProfileDto.language, 10)
          : updateProfileDto.language;
      await this.userRepository.update(userId, { language: languageNum });
    }
  }

  async getProfile(userId: number): Promise<{
    id: number;
    email: string;
    isVerified: boolean;
    status: boolean;
    language: number;
    fullName: string | null;
    avatarUrl: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    phoneNumber: string | null;
    address: string | null;
    country: string | null;
    showEmail: boolean;
    showPhone: boolean;
    roles: string[];
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        message: MESSAGES.AUTH.USER_NOT_FOUND,
        errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    const roles = userRoles.map((ur) => ur.role.name);

    const metadata = (user.profileMetadata as Record<string, unknown>) || {};
    return {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      status: user.status,
      language: user.language,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      phoneNumber: user.phoneNumber,
      address: user.address,
      country: user.country,
      showEmail: (metadata.showEmail as boolean) || false,
      showPhone: (metadata.showPhone as boolean) || false,
      roles,
    };
  }

  async oauthLogin(provider: 'google' | 'facebook', accessToken: string): Promise<AuthResponse> {
    try {
      let userInfo: {
        email: string;
        name?: string;
        picture?: string;
        id?: string;
      };

      if (provider === 'google') {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new UnauthorizedException({
            message: MESSAGES.AUTH.INVALID_CREDENTIALS,
            errorCode: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          });
        }

        userInfo = await response.json();
      } else if (provider === 'facebook') {
        const response = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`,
        );

        if (!response.ok) {
          throw new UnauthorizedException({
            message: MESSAGES.AUTH.INVALID_CREDENTIALS,
            errorCode: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          });
        }

        const data = await response.json();
        userInfo = {
          email: data.email,
          name: data.name,
          picture: data.picture?.data?.url,
          id: data.id,
        };
      } else {
        throw new BadRequestException({
          message: 'Invalid OAuth provider',
          errorCode: 'INVALID_OAUTH_PROVIDER',
        });
      }

      if (!userInfo.email) {
        throw new BadRequestException({
          message: 'Email is required from OAuth provider',
          errorCode: 'OAUTH_EMAIL_REQUIRED',
        });
      }

      let user = await this.userRepository.findByEmail(userInfo.email);

      if (!user) {
        const hashedPassword = await bcrypt.hash(`${provider}_${userInfo.id || Date.now()}`, 10);
        user = await this.userRepository.create({
          email: userInfo.email,
          hashedPassword,
          isVerified: true,
          status: true,
          language: LANGUAGE.VI,
          fullName: userInfo.name || null,
          avatarUrl: userInfo.picture || null,
        });

        // Assign default user role to OAuth users
        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: ROLE_IDS.USER,
          },
        });
      } else {
        if (!user.status) {
          throw new UnauthorizedException({
            message: MESSAGES.AUTH.ACCOUNT_LOCKED,
            errorCode: 'AUTH_ACCOUNT_LOCKED',
          });
        }

        if (userInfo.picture && !user.avatarUrl) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              avatarUrl: userInfo.picture,
              updatedAt: BigInt(Date.now()),
            },
          });
        }
      }

      // Fetch user roles to include in access token
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: user.id },
        include: { role: true },
      });

      const tokens = await this.generateTokens(
        user.id,
        user.email,
        userRoles.map((ur) => ur.roleId),
      );
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      // Track last login time
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: BigInt(Date.now()) },
      });

      const roles = userRoles.map((ur) => ur.role.name);

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
          status: user.status,
          language: user.language,
        },
        tokens,
        roles,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `OAuth login error for ${provider}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new UnauthorizedException({
        message: MESSAGES.AUTH.INVALID_CREDENTIALS,
        errorCode: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      });
    }
  }
}
