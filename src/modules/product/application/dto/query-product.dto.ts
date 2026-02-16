import { IsOptional, IsInt, IsString, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class QueryProductDto {
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
    description: 'Filter by seller ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  sellerId?: number;

  @ApiProperty({
    description: 'Filter by category ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  categoryId?: number;

  @ApiProperty({
    description: 'Filter by status',
    example: 'active',
    enum: ['draft', 'active', 'sold', 'archived', 'suspended'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['draft', 'active', 'sold', 'archived', 'suspended'], {
    message: VALIDATION_MESSAGES.IS_ENUM,
  })
  status?: string;

  @ApiProperty({
    description: 'Search by title or description',
    example: 'iPhone',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  search?: string;

  @ApiProperty({
    description: 'Filter featured products',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  isFeatured?: boolean;

  @ApiProperty({
    description: 'Filter promoted products',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  isPromoted?: boolean;

  @ApiProperty({
    description: 'Cursor for cursor-based pagination (product ID to start after)',
    example: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  cursor?: number;
}
