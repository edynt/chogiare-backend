import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoostType } from '@prisma/client';

export class CreatePackageDto {
  @ApiProperty({ description: 'Package name', example: 'Premium Boost' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Package type', enum: BoostType })
  @IsEnum(BoostType)
  type: BoostType;

  @ApiProperty({ description: 'Package price', example: 99.99 })
  @IsNumber()
  @Min(0)
  price: number;

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
