import { IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class QueryCategoryDto {
  @IsInt({ message: VALIDATION_MESSAGES.PARENT_ID.IS_STRING })
  @IsOptional()
  @Type(() => Number)
  parentId?: number;

  @IsBoolean({ message: VALIDATION_MESSAGES.IS_ACTIVE.IS_BOOLEAN })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

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

