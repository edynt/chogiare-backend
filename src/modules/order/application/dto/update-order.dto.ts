import {
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../domain/entities/order.entity';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class UpdateOrderDto {
  @IsEnum(OrderStatus, { message: VALIDATION_MESSAGES.ORDER_STATUS.IS_INVALID })
  @IsOptional()
  status?: OrderStatus;

  @IsEnum(PaymentStatus, { message: VALIDATION_MESSAGES.PAYMENT_STATUS.IS_INVALID })
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsEnum(PaymentMethod, { message: VALIDATION_MESSAGES.PAYMENT_METHOD.IS_INVALID })
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString({ message: VALIDATION_MESSAGES.NOTES.IS_STRING })
  @IsOptional()
  notes?: string;

  @IsString({ message: VALIDATION_MESSAGES.SELLER_NOTES.IS_STRING })
  @IsOptional()
  sellerNotes?: string;
}

