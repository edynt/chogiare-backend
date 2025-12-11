import { IsOptional, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export class QueryAdminOrderDto {
  @ApiProperty({ description: 'User ID filter', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({ description: 'Store ID filter', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  storeId?: number;

  @ApiProperty({ description: 'Order status filter', enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ description: 'Payment status filter', enum: PaymentStatus, required: false })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

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
