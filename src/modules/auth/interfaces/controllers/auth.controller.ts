import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from '@modules/auth/application/services/auth.service';
import { LoginDto } from '@modules/auth/application/dto/login.dto';
import { AdminLoginDto } from '@modules/auth/application/dto/admin-login.dto';
import { RegisterDto } from '@modules/auth/application/dto/register.dto';
import { RefreshTokenDto } from '@modules/auth/application/dto/refresh-token.dto';
import { VerifyEmailDto } from '@modules/auth/application/dto/verify-email.dto';
import { ForgotPasswordDto } from '@modules/auth/application/dto/forgot-password.dto';
import { ResetPasswordDto } from '@modules/auth/application/dto/reset-password.dto';
import { ChangePasswordDto } from '@modules/auth/application/dto/change-password.dto';
import { UpdateProfileDto } from '@modules/auth/application/dto/update-profile.dto';
import { ResendVerificationDto } from '@modules/auth/application/dto/resend-verification.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { SkipHeaderValidation } from '@common/decorators/skip-header-validation.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @SkipHeaderValidation()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    type: RegisterDto,
    examples: {
      example1: {
        summary: 'Register with full name, email and password',
        value: {
          fullName: 'Nguyen Van A',
          email: 'user@example.com',
          password: 'password123',
        },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Public()
  @SkipHeaderValidation()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    type: LoginDto,
    examples: {
      example1: {
        summary: 'Login example',
        value: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Public()
  @SkipHeaderValidation()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login with email and password' })
  @ApiBody({
    type: AdminLoginDto,
    examples: {
      example1: {
        summary: 'Admin login example',
        value: {
          email: 'admin@example.com',
          password: 'adminPassword123',
        },
      },
    },
  })
  async adminLogin(@Body() adminLoginDto: AdminLoginDto) {
    return await this.authService.adminLogin(adminLoginDto);
  }

  @Public()
  @SkipHeaderValidation()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with verification code' })
  @ApiBody({
    type: VerifyEmailDto,
    examples: {
      example1: {
        summary: 'Verify email example',
        value: {
          code: '123456',
        },
      },
    },
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    await this.authService.verifyEmail(verifyEmailDto.code);
    return {
      message: 'Email verified successfully',
    };
  }

  @Public()
  @SkipHeaderValidation()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({
    type: ForgotPasswordDto,
    examples: {
      example1: {
        summary: 'Forgot password example',
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @SkipHeaderValidation()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with reset token' })
  @ApiBody({
    type: ResetPasswordDto,
    examples: {
      example1: {
        summary: 'Reset password example',
        value: {
          resetToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNjM4MzY4MDAwMDAwIiwidHlwZSI6InBhc3N3b3JkLXJlc2V0IiwiaWF0IjoxNjM4MzY4MDAwLCJleHAiOjE2MzgzNzE2MDB9.example',
          newPassword: 'newPassword123',
        },
      },
    },
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return {
      message: MESSAGES.AUTH.PASSWORD_RESET_SUCCESS,
    };
  }

  @Public()
  @SkipHeaderValidation()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      example1: {
        summary: 'Refresh token example',
        value: {
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTYzODM2ODAwMCwiZXhwIjoxNjM4NDU0NDAwfQ.example',
        },
      },
    },
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user and invalidate tokens' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Optional refresh token to invalidate',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTYzODM2ODAwMCwiZXhwIjoxNjM4NDU0NDAwfQ.example',
        },
      },
    },
    required: false,
    examples: {
      example1: {
        summary: 'Logout without refresh token',
        value: {},
      },
      example2: {
        summary: 'Logout with refresh token',
        value: {
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTYzODM2ODAwMCwiZXhwIjoxNjM4NDU0NDAwfQ.example',
        },
      },
    },
  })
  async logout(
    @CurrentUser() user: CurrentUserPayload,
    @Body('refreshToken') refreshToken?: string,
  ) {
    await this.authService.logout(user.id, refreshToken);
    return {
      message: MESSAGES.AUTH.LOGOUT_SUCCESS,
    };
  }

  @Public()
  @SkipHeaderValidation()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification code' })
  @ApiBody({
    type: ResendVerificationDto,
    examples: {
      example1: {
        summary: 'Resend verification example',
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    await this.authService.resendVerificationEmail(resendVerificationDto.email);
    return {
      message: MESSAGES.AUTH.VERIFICATION_EMAIL_RESENT,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile with roles' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return await this.authService.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({
    type: UpdateProfileDto,
    examples: {
      example1: {
        summary: 'Update profile example',
        value: {
          fullName: 'Nguyen Van B',
          phoneNumber: '+84901234567',
          language: 'en',
        },
      },
    },
  })
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    await this.authService.updateProfile(user.id, updateProfileDto);
    return {
      message: MESSAGES.AUTH.PROFILE_UPDATED,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password' })
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      example1: {
        summary: 'Change password example',
        value: {
          currentPassword: 'oldPassword123',
          newPassword: 'newPassword123',
        },
      },
    },
  })
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.id, changePasswordDto);
    return {
      message: MESSAGES.AUTH.PASSWORD_CHANGED_SUCCESS,
    };
  }

  @Public()
  @SkipHeaderValidation()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register with Google OAuth' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: 'Google OAuth access token',
          example: 'ya29.a0AfH6SMBx...',
        },
        providerId: {
          type: 'string',
          description: 'Google user ID',
          example: '123456789',
        },
      },
      required: ['accessToken'],
    },
  })
  async googleAuth(@Body() body: { accessToken: string; providerId?: string }) {
    return await this.authService.oauthLogin('google', body.accessToken, body.providerId);
  }

  @Public()
  @SkipHeaderValidation()
  @Post('facebook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register with Facebook OAuth' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: 'Facebook OAuth access token',
          example: 'EAABwzLix...',
        },
        providerId: {
          type: 'string',
          description: 'Facebook user ID',
          example: '123456789',
        },
      },
      required: ['accessToken'],
    },
  })
  async facebookAuth(@Body() body: { accessToken: string; providerId?: string }) {
    return await this.authService.oauthLogin('facebook', body.accessToken, body.providerId);
  }
}
