import { IsOptional, IsNumber, IsString, IsInt, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ORDER_STATUS_VALUES,
  OrderStatusType,
  PAYMENT_STATUS_VALUES,
  PaymentStatusType,
} from '@common/constants/enum.constants';

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

  @ApiProperty({
    description: 'Order status filter (0=pending, 1=confirmed, 2=preparing, 3=ready_for_pickup, 4=completed, 5=cancelled, 6=refunded)',
    enum: ORDER_STATUS_VALUES,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(ORDER_STATUS_VALUES)
  status?: OrderStatusType;

  @ApiProperty({
    description: 'Payment status filter (0=pending, 1=completed, 2=failed, 3=refunded)',
    enum: PAYMENT_STATUS_VALUES,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(PAYMENT_STATUS_VALUES)
  paymentStatus?: PaymentStatusType;

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
