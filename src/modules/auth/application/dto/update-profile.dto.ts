import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Full name',
    example: 'Nguyen Van A',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH(255) })
  fullName?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+84901234567',
    maxLength: 20,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(20, { message: VALIDATION_MESSAGES.MAX_LENGTH(20) })
  phoneNumber?: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(500, { message: VALIDATION_MESSAGES.MAX_LENGTH(500) })
  avatarUrl?: string;

  @ApiProperty({
    description: 'Gender',
    example: 'male',
    enum: ['male', 'female', 'other'],
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(20, { message: VALIDATION_MESSAGES.MAX_LENGTH(20) })
  gender?: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01',
    maxLength: 10,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(10, { message: VALIDATION_MESSAGES.MAX_LENGTH(10) })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Address',
    example: '123 Main Street',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(500, { message: VALIDATION_MESSAGES.MAX_LENGTH(500) })
  address?: string;

  @ApiProperty({
    description: 'Country',
    example: 'Vietnam',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH(100) })
  country?: string;

  @ApiProperty({
    description: 'Language preference',
    example: 'vi',
    enum: ['vi', 'en'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['vi', 'en'], { message: VALIDATION_MESSAGES.IS_ENUM })
  language?: string;
}
