import { IsOptional, IsInt, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';
import {
  ORDER_STATUS_VALUES,
  OrderStatusType,
  PAYMENT_STATUS_VALUES,
  PaymentStatusType,
} from '@common/constants/enum.constants';

export class QueryOrderDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  page?: number;

  @ApiProperty({
    description: 'Page size',
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  pageSize?: number;

  @ApiProperty({
    description: 'Filter by order status (0=pending, 1=confirmed, 2=preparing, 3=ready_for_pickup, 4=completed, 5=cancelled, 6=refunded)',
    enum: ORDER_STATUS_VALUES,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @IsIn(ORDER_STATUS_VALUES, { message: VALIDATION_MESSAGES.IS_ENUM })
  status?: OrderStatusType;

  @ApiProperty({
    description: 'Filter by payment status (0=pending, 1=completed, 2=failed, 3=refunded)',
    enum: PAYMENT_STATUS_VALUES,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @IsIn(PAYMENT_STATUS_VALUES, { message: VALIDATION_MESSAGES.IS_ENUM })
  paymentStatus?: PaymentStatusType;
}
