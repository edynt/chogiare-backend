import { IsOptional, IsNumber, IsString, IsInt, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  TRANSACTION_TYPE_VALUES,
  TransactionTypeValue,
  PAYMENT_METHOD_VALUES,
  PaymentMethodType,
} from '@common/constants/enum.constants';

export class QueryAdminPaymentDto {
  @ApiProperty({ description: 'User ID filter', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({
    description: 'Transaction type filter (0=deposit, 1=sale, 2=refund, 3=commission, 4=bonus, 5=subscription_purchase, 6=boost)',
    enum: TRANSACTION_TYPE_VALUES,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(TRANSACTION_TYPE_VALUES)
  type?: TransactionTypeValue;

  @ApiProperty({
    description: 'Payment method filter (0=bank_transfer)',
    enum: PAYMENT_METHOD_VALUES,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(PAYMENT_METHOD_VALUES)
  paymentMethod?: PaymentMethodType;

  @ApiProperty({ description: 'Status filter', required: false })
  @IsOptional()
  @IsString()
  status?: string;

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
