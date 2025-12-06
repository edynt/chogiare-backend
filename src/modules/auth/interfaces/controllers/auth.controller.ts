import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from '@modules/auth/application/services/auth.service';
import { LoginDto } from '@modules/auth/application/dto/login.dto';
import { RegisterDto } from '@modules/auth/application/dto/register.dto';
import { RefreshTokenDto } from '@modules/auth/application/dto/refresh-token.dto';
import { VerifyEmailDto } from '@modules/auth/application/dto/verify-email.dto';
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

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }
}
