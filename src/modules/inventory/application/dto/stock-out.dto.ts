import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StockOutDto {
  @ApiProperty({ description: 'Product ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  productId: number;

  @ApiProperty({ description: 'Quantity to subtract', example: 10, minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Reason for stock out',
    example: 'Order completed',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({ description: 'Reference ID (e.g., order ID)', example: 123, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  referenceId?: number;

  @ApiProperty({ description: 'Reference type', example: 'order', required: false, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceType?: string;
}
