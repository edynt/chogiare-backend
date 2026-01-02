import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BoostType } from '@prisma/client';

export class UpdatePackageDto {
  @ApiPropertyOptional({ description: 'Package name', example: 'Premium Boost' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Package type', enum: BoostType })
  @IsOptional()
  @IsEnum(BoostType)
  type?: BoostType;

  @ApiPropertyOptional({ description: 'Package price', example: 99.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Package description',
    example: 'Boost your product visibility',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Package configuration (JSON)', example: {} })
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is package active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  @IsOptional()
  metadata?: Record<string, any>;
}
