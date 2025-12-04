import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsInt,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCondition, ProductStatus, ProductBadge } from '../../domain/entities/product.entity';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class QueryProductDto {
  @IsString({ message: VALIDATION_MESSAGES.QUERY.IS_STRING })
  @IsOptional()
  query?: string;

  @IsInt({ message: VALIDATION_MESSAGES.CATEGORY_ID.IS_STRING })
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsInt({ message: VALIDATION_MESSAGES.SELLER_ID.IS_STRING })
  @IsOptional()
  @Type(() => Number)
  sellerId?: number;

  @IsInt({ message: VALIDATION_MESSAGES.STORE_ID.IS_STRING })
  @IsOptional()
  @Type(() => Number)
  storeId?: number;

  @IsNumber({}, { message: VALIDATION_MESSAGES.MIN_PRICE.IS_NUMBER })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: VALIDATION_MESSAGES.MIN_PRICE.MIN })
  minPrice?: number;

  @IsNumber({}, { message: VALIDATION_MESSAGES.MAX_PRICE.IS_NUMBER })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: VALIDATION_MESSAGES.MAX_PRICE.MIN })
  maxPrice?: number;

  @IsEnum(ProductCondition, { message: VALIDATION_MESSAGES.PRODUCT_CONDITION.IS_INVALID })
  @IsOptional()
  condition?: ProductCondition;

  @IsString({ message: VALIDATION_MESSAGES.LOCATION.IS_STRING })
  @IsOptional()
  location?: string;

  @IsArray({ message: VALIDATION_MESSAGES.BADGES.IS_ARRAY })
  @IsOptional()
  @IsEnum(ProductBadge, { each: true, message: VALIDATION_MESSAGES.BADGES.IS_INVALID })
  badges?: ProductBadge[];

  @IsNumber({}, { message: VALIDATION_MESSAGES.RATING.IS_NUMBER })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: VALIDATION_MESSAGES.RATING.MIN })
  @Max(5, { message: VALIDATION_MESSAGES.RATING.MAX })
  rating?: number;

  @IsNumber({}, { message: VALIDATION_MESSAGES.MIN_RATING.IS_NUMBER })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: VALIDATION_MESSAGES.MIN_RATING.MIN })
  @Max(5, { message: VALIDATION_MESSAGES.MIN_RATING.MAX })
  minRating?: number;

  @IsBoolean({ message: VALIDATION_MESSAGES.IS_FEATURED.IS_BOOLEAN })
  @IsOptional()
  @Type(() => Boolean)
  featured?: boolean;

  @IsBoolean({ message: VALIDATION_MESSAGES.IS_PROMOTED.IS_BOOLEAN })
  @IsOptional()
  @Type(() => Boolean)
  promoted?: boolean;

  @IsEnum(ProductStatus, { message: VALIDATION_MESSAGES.PRODUCT_STATUS.IS_INVALID })
  @IsOptional()
  status?: ProductStatus;

  @IsBoolean({ message: VALIDATION_MESSAGES.IS_ACTIVE.IS_BOOLEAN })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsString({ message: VALIDATION_MESSAGES.SORT_BY.IS_STRING })
  @IsOptional()
  sortBy?: 'price' | 'createdAt' | 'rating' | 'viewCount';

  @IsString({ message: VALIDATION_MESSAGES.SORT_ORDER.IS_STRING })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @IsInt({ message: VALIDATION_MESSAGES.PAGE.IS_INT })
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: VALIDATION_MESSAGES.PAGE.MIN })
  page?: number = 1;

  @IsInt({ message: VALIDATION_MESSAGES.LIMIT.IS_INT })
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: VALIDATION_MESSAGES.LIMIT.MIN })
  @Max(100, { message: VALIDATION_MESSAGES.LIMIT.MAX })
  limit?: number = 20;
}

