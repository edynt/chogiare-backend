import { IsOptional, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

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

  @ApiProperty({ description: 'Product status filter', enum: ProductStatus, required: false })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

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
