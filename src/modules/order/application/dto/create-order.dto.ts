import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../domain/entities/order.entity';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

class OrderItemDto {
  @IsInt({ message: VALIDATION_MESSAGES.PRODUCT_ID.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.PRODUCT_ID.IS_REQUIRED })
  productId: number;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.QUANTITY.IS_REQUIRED })
  quantity: number;
}

export class CreateOrderDto {
  @IsInt({ message: VALIDATION_MESSAGES.STORE_ID.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.STORE_ID.IS_REQUIRED })
  storeId: number;

  @IsEnum(PaymentMethod, { message: VALIDATION_MESSAGES.PAYMENT_METHOD.IS_INVALID })
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsInt({ message: VALIDATION_MESSAGES.SHIPPING_ADDRESS_ID.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.SHIPPING_ADDRESS_ID.IS_REQUIRED })
  shippingAddressId: number;

  @IsInt({ message: VALIDATION_MESSAGES.BILLING_ADDRESS_ID.IS_STRING })
  @IsOptional()
  billingAddressId?: number;

  @IsString({ message: VALIDATION_MESSAGES.NOTES.IS_STRING })
  @IsOptional()
  notes?: string;

  @IsArray({ message: VALIDATION_MESSAGES.ITEMS.IS_ARRAY })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.ITEMS.IS_REQUIRED })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

