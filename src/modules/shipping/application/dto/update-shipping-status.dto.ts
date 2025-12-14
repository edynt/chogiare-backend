import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ShippingStatus } from '@modules/shipping/domain/entities/shipping.entity';

export class UpdateShippingStatusDto {
  @ApiProperty({
    description: 'Shipping status',
    enum: ShippingStatus,
  })
  @IsEnum(ShippingStatus)
  status: ShippingStatus;

  @ApiPropertyOptional({ description: 'Current location', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  currentLocation?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}


