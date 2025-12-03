import { IsOptional, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus } from '../../domain/entities/order.entity';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class QueryOrderDto {
  @IsEnum(OrderStatus, { message: VALIDATION_MESSAGES.ORDER_STATUS.IS_INVALID })
  @IsOptional()
  status?: OrderStatus;

  @IsEnum(PaymentStatus, { message: VALIDATION_MESSAGES.PAYMENT_STATUS.IS_INVALID })
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsString({ message: VALIDATION_MESSAGES.STORE_ID.IS_STRING })
  @IsOptional()
  storeId?: string;

  @IsInt({ message: VALIDATION_MESSAGES.PAGE.IS_INT })
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: VALIDATION_MESSAGES.PAGE.MIN })
  page?: number = 1;

  @IsInt({ message: VALIDATION_MESSAGES.LIMIT.IS_INT })
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: VALIDATION_MESSAGES.LIMIT.MIN })
  @Max(100, { message: VALIDATION_MESSAGES.LIMIT.MAX })
  limit?: number = 20;
}

