import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingStatus } from '@prisma/client';

export class UpdateShippingDto {
  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Carrier name' })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional({ enum: ShippingStatus, description: 'Shipping status' })
  @IsOptional()
  @IsEnum(ShippingStatus)
  status?: ShippingStatus;

  @ApiPropertyOptional({ description: 'Current location' })
  @IsOptional()
  @IsString()
  currentLocation?: string;

  @ApiPropertyOptional({ description: 'Estimated delivery timestamp' })
  @IsOptional()
  @IsNumber()
  estimatedDelivery?: number;
}

export class AddShippingHistoryDto {
  @ApiPropertyOptional({ description: 'Status description' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}
