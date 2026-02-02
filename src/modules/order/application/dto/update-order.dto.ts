import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ORDER_STATUS_VALUES,
  OrderStatusType,
  PAYMENT_STATUS_VALUES,
  PaymentStatusType,
  PAYMENT_METHOD_VALUES,
  PaymentMethodType,
} from '@common/constants/enum.constants';

export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Order status (0=pending, 1=confirmed, 2=preparing, 3=ready_for_pickup, 4=completed, 5=cancelled, 6=refunded)',
    enum: ORDER_STATUS_VALUES,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(ORDER_STATUS_VALUES)
  status?: OrderStatusType;

  @ApiPropertyOptional({
    description: 'Payment status (0=pending, 1=completed, 2=failed, 3=refunded)',
    enum: PAYMENT_STATUS_VALUES,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(PAYMENT_STATUS_VALUES)
  paymentStatus?: PaymentStatusType;

  @ApiPropertyOptional({
    description: 'Payment method (0=bank_transfer)',
    enum: PAYMENT_METHOD_VALUES,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(PAYMENT_METHOD_VALUES)
  paymentMethod?: PaymentMethodType;

  @ApiPropertyOptional({ description: 'Shipping address ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  shippingAddressId?: number;

  @ApiPropertyOptional({ description: 'Billing address ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  billingAddressId?: number;

  @ApiPropertyOptional({ description: 'Order notes', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
