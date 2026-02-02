import { IsOptional, IsNumber, IsString, IsInt, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PRODUCT_STATUS_VALUES, ProductStatusType } from '@common/constants/enum.constants';

export class QueryAdminProductDto {
  @ApiProperty({ description: 'Seller ID filter', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sellerId?: number;

  @ApiProperty({ description: 'Category ID filter', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @ApiProperty({
    description: 'Product status filter (0=draft, 1=active, 2=out_of_stock)',
    enum: PRODUCT_STATUS_VALUES,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(PRODUCT_STATUS_VALUES)
  status?: ProductStatusType;

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Page number', example: 1, default: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Page size', example: 10, default: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  pageSize?: number;
}
