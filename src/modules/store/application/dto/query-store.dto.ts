import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class QueryStoreDto {
  @IsString({ message: VALIDATION_MESSAGES.QUERY.IS_STRING })
  @IsOptional()
  search?: string;

  @IsBoolean({ message: VALIDATION_MESSAGES.IS_VERIFIED.IS_BOOLEAN })
  @IsOptional()
  @Type(() => Boolean)
  isVerified?: boolean;

  @IsBoolean({ message: VALIDATION_MESSAGES.IS_ACTIVE.IS_BOOLEAN })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsString({ message: VALIDATION_MESSAGES.ADDRESS_CITY.IS_STRING })
  @IsOptional()
  city?: string;

  @IsString({ message: VALIDATION_MESSAGES.STATE.IS_STRING })
  @IsOptional()
  state?: string;

  @IsString({ message: VALIDATION_MESSAGES.COUNTRY.IS_STRING })
  @IsOptional()
  country?: string;

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

