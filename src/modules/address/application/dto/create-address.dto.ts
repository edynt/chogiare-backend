import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength, MinLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ description: 'Recipient name', maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  recipientName: string;

  @ApiProperty({ description: 'Recipient phone', maxLength: 20 })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  recipientPhone: string;

  @ApiProperty({ description: 'Street address', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  street: string;

  @ApiProperty({ description: 'City', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city: string;

  @ApiProperty({ description: 'State/Province', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  state: string;

  @ApiPropertyOptional({ description: 'District', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional({ description: 'Ward', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string;

  @ApiProperty({ description: 'ZIP/Postal code', maxLength: 20 })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  zipCode: string;

  @ApiProperty({ description: 'Country', maxLength: 100, default: 'Vietnam' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country: string;

  @ApiPropertyOptional({ description: 'Set as default address', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}


