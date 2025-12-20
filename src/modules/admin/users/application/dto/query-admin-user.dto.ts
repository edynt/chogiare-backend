import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryAdminUserDto {
  @ApiProperty({ description: 'Search term (name, email, phone)', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'User status filter', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'User role filter', required: false })
  @IsOptional()
  @IsString()
  role?: string;

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
