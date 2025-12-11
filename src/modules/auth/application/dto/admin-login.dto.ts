import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
    maxLength: 255,
  })
  @IsEmail({}, { message: VALIDATION_MESSAGES.IS_EMAIL })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH(255) })
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'adminPassword123',
    minLength: 6,
    maxLength: 100,
  })
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @MinLength(6, { message: VALIDATION_MESSAGES.MIN_LENGTH(6) })
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH(100) })
  password: string;
}
