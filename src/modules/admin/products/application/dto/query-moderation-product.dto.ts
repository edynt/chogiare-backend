import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryModerationProductDto {
  @ApiProperty({ description: 'Page number', example: 1, default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Page size', example: 50, default: 50, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;

  @ApiProperty({ description: 'Category ID or name filter', required: false })
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Product status filter', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Priority filter', required: false })
  @IsOptional()
  @IsString()
  priority?: string;
}

