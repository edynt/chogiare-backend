import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StockInDto {
  @ApiProperty({ description: 'Product ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  productId: number;

  @ApiProperty({ description: 'Quantity to add', example: 100, minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Cost price per unit', example: 50000, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costPrice?: number;

  @ApiProperty({
    description: 'Supplier name',
    example: 'Supplier ABC',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  supplier?: string;

  @ApiProperty({ description: 'Notes', example: 'Initial stock', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
