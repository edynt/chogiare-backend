import { IsInt, IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';
import { PaymentMethod } from '@prisma/client';

export class CreateOrderFromCartDto {
  @ApiProperty({
    description: 'Seller ID (required when creating order from cart grouped by seller)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  sellerId: number;

  @ApiProperty({
    description: 'Shipping address ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  shippingAddressId?: number;

  @ApiProperty({
    description: 'Billing address ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  billingAddressId?: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: VALIDATION_MESSAGES.IS_ENUM })
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: 'Order notes',
    example: 'Please deliver in the morning',
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(1000, { message: VALIDATION_MESSAGES.MAX_LENGTH(1000) })
  notes?: string;
}
