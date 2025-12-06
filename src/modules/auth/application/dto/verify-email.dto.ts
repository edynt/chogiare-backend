import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification code',
    example: '123456',
    maxLength: 10,
  })
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @MaxLength(10, { message: VALIDATION_MESSAGES.MAX_LENGTH(10) })
  code: string;
}
