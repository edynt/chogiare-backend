import { IsOptional, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionType, PaymentMethod } from '@prisma/client';

export class QueryAdminPaymentDto {
  @ApiProperty({ description: 'User ID filter', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({ description: 'Transaction type filter', enum: TransactionType, required: false })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiProperty({ description: 'Payment method filter', enum: PaymentMethod, required: false })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

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
