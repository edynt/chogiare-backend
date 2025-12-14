import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Order status',
    enum: OrderStatus,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Payment status',
    enum: PaymentStatus,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

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


