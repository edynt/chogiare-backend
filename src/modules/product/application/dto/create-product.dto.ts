import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
  IsArray,
  IsEnum,
  IsBoolean,
  IsUrl,
  ArrayMaxSize,
} from 'class-validator';
import {
  ProductCondition,
  ProductStatus,
  ProductBadge,
} from '../../domain/entities/product.entity';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class CreateProductDto {
  @IsString({ message: VALIDATION_MESSAGES.TITLE.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.TITLE.IS_REQUIRED })
  @MaxLength(255, { message: VALIDATION_MESSAGES.TITLE.MAX_LENGTH_255 })
  title: string;

  @IsString({ message: VALIDATION_MESSAGES.DESCRIPTION.IS_STRING })
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: VALIDATION_MESSAGES.PRICE.IS_NUMBER })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.PRICE.IS_REQUIRED })
  @Min(0, { message: VALIDATION_MESSAGES.PRICE.MIN })
  price: number;

  @IsNumber({}, { message: VALIDATION_MESSAGES.ORIGINAL_PRICE.IS_NUMBER })
  @IsOptional()
  @Min(0, { message: VALIDATION_MESSAGES.ORIGINAL_PRICE.MIN })
  originalPrice?: number;

  @IsString({ message: VALIDATION_MESSAGES.CATEGORY_ID.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.CATEGORY_ID.IS_REQUIRED })
  categoryId: string;

  @IsString({ message: VALIDATION_MESSAGES.STORE_ID.IS_STRING })
  @IsOptional()
  storeId?: string;

  @IsEnum(ProductCondition, { message: VALIDATION_MESSAGES.PRODUCT_CONDITION.IS_INVALID })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.PRODUCT_CONDITION.IS_REQUIRED })
  condition: ProductCondition;

  @IsArray({ message: VALIDATION_MESSAGES.TAGS.IS_ARRAY })
  @IsOptional()
  @IsString({ each: true, message: VALIDATION_MESSAGES.TAGS.EACH_IS_STRING })
  @ArrayMaxSize(10, { message: VALIDATION_MESSAGES.TAGS.MAX_SIZE_10 })
  tags?: string[];

  @IsString({ message: VALIDATION_MESSAGES.LOCATION.IS_STRING })
  @IsOptional()
  @MaxLength(255, { message: VALIDATION_MESSAGES.LOCATION.MAX_LENGTH_255 })
  location?: string;

  @IsNumber({}, { message: VALIDATION_MESSAGES.STOCK.IS_NUMBER })
  @IsOptional()
  @Min(0, { message: VALIDATION_MESSAGES.STOCK.MIN })
  stock?: number;

  @IsNumber({}, { message: VALIDATION_MESSAGES.MIN_STOCK.IS_NUMBER })
  @IsOptional()
  @Min(0, { message: VALIDATION_MESSAGES.MIN_STOCK.MIN })
  minStock?: number;

  @IsNumber({}, { message: VALIDATION_MESSAGES.MAX_STOCK.IS_NUMBER })
  @IsOptional()
  @Min(0, { message: VALIDATION_MESSAGES.MAX_STOCK.MIN })
  maxStock?: number;

  @IsNumber({}, { message: VALIDATION_MESSAGES.COST_PRICE.IS_NUMBER })
  @IsOptional()
  @Min(0, { message: VALIDATION_MESSAGES.COST_PRICE.MIN })
  costPrice?: number;

  @IsString({ message: VALIDATION_MESSAGES.SKU.IS_STRING })
  @IsOptional()
  @MaxLength(100, { message: VALIDATION_MESSAGES.SKU.MAX_LENGTH_100 })
  sku?: string;

  @IsString({ message: VALIDATION_MESSAGES.BARCODE.IS_STRING })
  @IsOptional()
  @MaxLength(100, { message: VALIDATION_MESSAGES.BARCODE.MAX_LENGTH_100 })
  barcode?: string;

  @IsNumber({}, { message: VALIDATION_MESSAGES.WEIGHT.IS_NUMBER })
  @IsOptional()
  @Min(0, { message: VALIDATION_MESSAGES.WEIGHT.MIN })
  weight?: number;

  @IsString({ message: VALIDATION_MESSAGES.DIMENSIONS.IS_STRING })
  @IsOptional()
  @MaxLength(100, { message: VALIDATION_MESSAGES.DIMENSIONS.MAX_LENGTH_100 })
  dimensions?: string;

  @IsString({ message: VALIDATION_MESSAGES.SUPPLIER.IS_STRING })
  @IsOptional()
  @MaxLength(255, { message: VALIDATION_MESSAGES.SUPPLIER.MAX_LENGTH_255 })
  supplier?: string;

  @IsEnum(ProductStatus, { message: VALIDATION_MESSAGES.PRODUCT_STATUS.IS_INVALID })
  @IsOptional()
  status?: ProductStatus;

  @IsArray({ message: VALIDATION_MESSAGES.BADGES.IS_ARRAY })
  @IsOptional()
  @IsEnum(ProductBadge, { each: true, message: VALIDATION_MESSAGES.BADGES.IS_INVALID })
  @ArrayMaxSize(5, { message: VALIDATION_MESSAGES.BADGES.MAX_SIZE_5 })
  badges?: ProductBadge[];

  @IsArray({ message: VALIDATION_MESSAGES.IMAGES.IS_ARRAY })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IMAGES.IS_REQUIRED })
  @IsUrl({}, { each: true, message: VALIDATION_MESSAGES.IMAGES.EACH_IS_URL })
  @ArrayMaxSize(10, { message: VALIDATION_MESSAGES.IMAGES.MAX_SIZE_10 })
  images: string[];

  @IsBoolean({ message: VALIDATION_MESSAGES.IS_ACTIVE.IS_BOOLEAN })
  @IsOptional()
  isActive?: boolean;
}
