import { IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ImportProductsDto {
  @ApiProperty({
    description: 'Skip validation errors and continue',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  skipErrors?: boolean;

  @ApiProperty({
    description: 'Update existing products by SKU',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  updateExisting?: boolean;
}
