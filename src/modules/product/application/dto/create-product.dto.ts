import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product title',
    example: 'iPhone 15 Pro Max 256GB',
    maxLength: 500,
  })
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @MaxLength(500, { message: VALIDATION_MESSAGES.MAX_LENGTH(500) })
  title: string;

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
  })
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  categoryId: number;

  @ApiProperty({
    description: 'Product price',
    example: 25000000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: VALIDATION_MESSAGES.IS_NUMBER })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @Min(0, { message: VALIDATION_MESSAGES.MIN(0) })
  price: number;

  @ApiProperty({
    description: 'Original price (for discount display)',
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
  })
  @IsEnum(['new', 'like_new', 'good', 'fair', 'poor'], {
    message: VALIDATION_MESSAGES.IS_ENUM,
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  condition: string;

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
    default: 0,
  })
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @Min(0, { message: VALIDATION_MESSAGES.MIN(0) })
  stock: number;

  @ApiProperty({
    description: 'Product status',
    example: 'active',
    enum: ['draft', 'active', 'out_of_stock'],
    default: 'active',
    required: false,
  })
  @IsOptional()
  @IsEnum(['draft', 'active', 'out_of_stock'], {
    message: VALIDATION_MESSAGES.IS_ENUM,
  })
  status?: string;

  @ApiProperty({
    description: 'Minimum stock threshold',
    example: 10,
    minimum: 0,
    default: 0,
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
    description: 'Cost price (for profit calculation)',
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
    description: 'Product tags',
    example: ['smartphone', 'apple', 'iphone'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return value;
  })
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
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsArray({ message: VALIDATION_MESSAGES.IS_ARRAY })
  @IsEnum(['NEW', 'FEATURED', 'PROMO', 'HOT', 'SALE'], {
    each: true,
    message: VALIDATION_MESSAGES.IS_ENUM,
  })
  badges?: string[];

  @ApiProperty({
    description: 'Product image URLs from Cloudinary (for backward compatibility)',
    example: [
      'https://res.cloudinary.com/dvweth7yl/image/upload/v1234567890/products/img1.jpg',
      'https://res.cloudinary.com/dvweth7yl/image/upload/v1234567890/products/img2.jpg',
    ],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: VALIDATION_MESSAGES.IS_ARRAY })
  @IsString({ each: true, message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(500, { each: true, message: VALIDATION_MESSAGES.MAX_LENGTH(500) })
  images?: string[];

  @ApiProperty({
    description: 'Warranty information',
    example: 'Bảo hành 12 tháng, đổi mới trong 7 ngày',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(500, { message: VALIDATION_MESSAGES.MAX_LENGTH(500) })
  warranty?: string;

  @ApiProperty({
    description: 'Return policy',
    example: 'Đổi trả trong 30 ngày nếu sản phẩm lỗi do nhà sản xuất',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  returnPolicy?: string;
}
