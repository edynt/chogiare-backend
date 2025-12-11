import { IsNotEmpty, IsNumber, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StockAdjustmentDto {
  @ApiProperty({ description: 'Product ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  productId: number;

  @ApiProperty({ description: 'New stock quantity', example: 150 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  newStock: number;

  @ApiProperty({
    description: 'Reason for adjustment',
    example: 'Physical count correction',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
