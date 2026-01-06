import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsString,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class DepositDto {
  @ApiProperty({
    description: 'Deposit amount',
    example: 100000,
    minimum: 1000,
  })
  @Type(() => Number)
  @IsNumber({}, { message: VALIDATION_MESSAGES.IS_NUMBER })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @Min(1000, { message: VALIDATION_MESSAGES.MIN(1000) })
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    example: 'bank_transfer',
    enum: ['bank_transfer'],
  })
  @IsEnum(['bank_transfer'], {
    message: VALIDATION_MESSAGES.IS_ENUM,
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  paymentMethod: string;

  @ApiProperty({
    description: 'Transaction reference (optional)',
    example: 'REF123456',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH(255) })
  reference?: string;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Deposit to wallet',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  description?: string;
}
