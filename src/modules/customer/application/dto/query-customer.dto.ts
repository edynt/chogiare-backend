import { IsOptional, IsInt, IsString, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class QueryCustomerDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  page?: number;

  @ApiProperty({
    description: 'Page size',
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  pageSize?: number;

  @ApiProperty({
    description: 'Search by email or full name',
    example: 'john@example.com',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  search?: string;

  @ApiProperty({
    description: 'Filter by status (active/locked)',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: VALIDATION_MESSAGES.IS_BOOLEAN })
  status?: boolean;

  @ApiProperty({
    description: 'Filter by email verification status',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: VALIDATION_MESSAGES.IS_BOOLEAN })
  isVerified?: boolean;

  @ApiProperty({
    description: 'Filter by role',
    example: 'user',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  role?: string;
}
