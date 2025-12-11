import { IsOptional, IsNumber, IsBoolean, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StockMovementType } from '@modules/inventory/domain/entities/stock-movement.entity';

export class QueryStockInDto {
  @ApiProperty({ description: 'Product ID', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  productId?: number;

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

export class QueryStockAlertDto {
  @ApiProperty({ description: 'Product ID', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  productId?: number;

  @ApiProperty({ description: 'Is read', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;

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

export class QueryStockMovementDto {
  @ApiProperty({ description: 'Product ID', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  productId?: number;

  @ApiProperty({ description: 'Movement type', enum: StockMovementType, required: false })
  @IsOptional()
  @IsEnum(StockMovementType)
  type?: StockMovementType;

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
