import { IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class QueryTransactionDto {
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
    description: 'Filter by transaction type',
    example: 'deposit',
    enum: ['deposit', 'sale', 'refund', 'commission', 'bonus'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['deposit', 'sale', 'refund', 'commission', 'bonus'], {
    message: VALIDATION_MESSAGES.IS_ENUM,
  })
  type?: string;

  @ApiProperty({
    description: 'Filter by transaction status',
    example: 'completed',
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['pending', 'completed', 'failed', 'cancelled'], {
    message: VALIDATION_MESSAGES.IS_ENUM,
  })
  status?: string;
}
