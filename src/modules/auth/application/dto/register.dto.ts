import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';
import { PASSWORD_PATTERNS, PASSWORD_MESSAGES } from '@common/constants/password.constants';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name',
    example: 'Nguyen Van A',
    maxLength: 255,
  })
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH(255) })
  fullName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    maxLength: 255,
  })
  @IsEmail({}, { message: VALIDATION_MESSAGES.IS_EMAIL })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH(255) })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
    minLength: 6,
    maxLength: 100,
  })
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @MinLength(PASSWORD_PATTERNS.MIN_LENGTH, {
    message: VALIDATION_MESSAGES.MIN_LENGTH(PASSWORD_PATTERNS.MIN_LENGTH),
  })
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH(100) })
  @Matches(PASSWORD_PATTERNS.LOWERCASE, { message: PASSWORD_MESSAGES.LOWERCASE })
  @Matches(PASSWORD_PATTERNS.UPPERCASE, { message: PASSWORD_MESSAGES.UPPERCASE })
  @Matches(PASSWORD_PATTERNS.SPECIAL_CHAR, { message: PASSWORD_MESSAGES.SPECIAL_CHAR })
  password: string;
}
