import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class RefreshTokenDto {
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @MaxLength(500, { message: VALIDATION_MESSAGES.MAX_LENGTH(500) })
  refreshToken: string;
}
