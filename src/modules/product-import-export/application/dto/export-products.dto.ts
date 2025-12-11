import { IsOptional, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ExportFormat {
  EXCEL = 'excel',
  CSV = 'csv',
}

export class ExportProductsDto {
  @ApiProperty({
    description: 'Category ID filter',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @ApiProperty({
    description: 'Status filter',
    required: false,
    enum: ['draft', 'active', 'sold', 'archived', 'suspended'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Search term',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    default: ExportFormat.EXCEL,
    required: false,
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}
