import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../domain/entities/order.entity';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

class OrderItemDto {
  @IsString({ message: VALIDATION_MESSAGES.PRODUCT_ID.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.PRODUCT_ID.IS_REQUIRED })
  @IsUUID('4', { message: VALIDATION_MESSAGES.PRODUCT_ID.IS_UUID })
  productId: string;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.QUANTITY.IS_REQUIRED })
  quantity: number;
}

export class CreateOrderDto {
  @IsString({ message: VALIDATION_MESSAGES.STORE_ID.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.STORE_ID.IS_REQUIRED })
  @IsUUID('4', { message: VALIDATION_MESSAGES.IS_UUID })
  storeId: string;

  @IsEnum(PaymentMethod, { message: VALIDATION_MESSAGES.PAYMENT_METHOD.IS_INVALID })
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString({ message: VALIDATION_MESSAGES.SHIPPING_ADDRESS_ID.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.SHIPPING_ADDRESS_ID.IS_REQUIRED })
  @IsUUID('4', { message: VALIDATION_MESSAGES.SHIPPING_ADDRESS_ID.IS_UUID })
  shippingAddressId: string;

  @IsString({ message: VALIDATION_MESSAGES.BILLING_ADDRESS_ID.IS_STRING })
  @IsOptional()
  @IsUUID('4', { message: VALIDATION_MESSAGES.BILLING_ADDRESS_ID.IS_UUID })
  billingAddressId?: string;

  @IsString({ message: VALIDATION_MESSAGES.NOTES.IS_STRING })
  @IsOptional()
  notes?: string;

  @IsArray({ message: VALIDATION_MESSAGES.ITEMS.IS_ARRAY })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.ITEMS.IS_REQUIRED })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

