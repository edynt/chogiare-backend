import { JwtService } from '@nestjs/jwt';

export class JwtUtil {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
  }

  generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    });
  }

  verifyToken(token: string, isRefresh = false): any {
    return this.jwtService.verify(token, {
      secret: isRefresh
        ? process.env.REFRESH_TOKEN_SECRET
        : process.env.JWT_SECRET,
    });
  }
}

