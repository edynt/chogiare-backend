import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@modules/auth/domain/repositories/user.repository.interface';
import { MESSAGES } from '@common/constants/messages.constants';

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(MESSAGES.AUTH.USER_DOES_NOT_EXIST);
    }
    if (!user.status) {
      throw new UnauthorizedException(MESSAGES.AUTH.ACCOUNT_IS_LOCKED);
    }
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
      status: user.status,
      language: user.language,
    };
  }
}
