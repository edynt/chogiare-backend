import {
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class UpdateProductDto {
  @ApiProperty({
    description: 'Product title',
    example: 'iPhone 15 Pro Max 256GB',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(500, { message: VALIDATION_MESSAGES.MAX_LENGTH(500) })
  title?: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Brand new iPhone 15 Pro Max with 256GB storage',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  description?: string;

  @ApiProperty({
    description: 'Category ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  categoryId?: number;

  @ApiProperty({
    description: 'Product price',
    example: 25000000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(0, { message: VALIDATION_MESSAGES.MIN(0) })
  price?: number;

  @ApiProperty({
    description: 'Original price',
    example: 30000000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(0, { message: VALIDATION_MESSAGES.MIN(0) })
  originalPrice?: number;

  @ApiProperty({
    description: 'Product condition',
    example: 'new',
    enum: ['new', 'like_new', 'good', 'fair', 'poor'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['new', 'like_new', 'good', 'fair', 'poor'], {
    message: VALIDATION_MESSAGES.IS_ENUM,
  })
  condition?: string;

  @ApiProperty({
    description: 'Product location',
    example: 'Ho Chi Minh City',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH(255) })
  location?: string;

  @ApiProperty({
    description: 'Stock quantity',
    example: 100,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(0, { message: VALIDATION_MESSAGES.MIN(0) })
  stock?: number;

  @ApiProperty({
    description: 'Minimum stock threshold',
    example: 10,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(0, { message: VALIDATION_MESSAGES.MIN(0) })
  minStock?: number;

  @ApiProperty({
    description: 'Maximum stock',
    example: 1000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(0, { message: VALIDATION_MESSAGES.MIN(0) })
  maxStock?: number;

  @ApiProperty({
    description: 'Cost price',
    example: 20000000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(0, { message: VALIDATION_MESSAGES.MIN(0) })
  costPrice?: number;

  @ApiProperty({
    description: 'Selling price',
    example: 25000000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(0, { message: VALIDATION_MESSAGES.MIN(0) })
  sellingPrice?: number;

  @ApiProperty({
    description: 'Product SKU',
    example: 'IPHONE15PM256',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH(100) })
  sku?: string;

  @ApiProperty({
    description: 'Product barcode',
    example: '1234567890123',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH(100) })
  barcode?: string;

  @ApiProperty({
    description: 'Product status',
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
    description: 'Is featured',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.IS_BOOLEAN })
  isFeatured?: boolean;

  @ApiProperty({
    description: 'Is promoted',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.IS_BOOLEAN })
  isPromoted?: boolean;

  @ApiProperty({
    description: 'Product tags',
    example: ['smartphone', 'apple', 'iphone'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: VALIDATION_MESSAGES.IS_ARRAY })
  @IsString({ each: true, message: VALIDATION_MESSAGES.IS_STRING })
  tags?: string[];

  @ApiProperty({
    description: 'Product badges',
    example: ['NEW', 'FEATURED'],
    enum: ['NEW', 'FEATURED', 'PROMO', 'HOT', 'SALE'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: VALIDATION_MESSAGES.IS_ARRAY })
  @IsEnum(['NEW', 'FEATURED', 'PROMO', 'HOT', 'SALE'], {
    each: true,
    message: VALIDATION_MESSAGES.IS_ENUM,
  })
  badges?: string[];
}
