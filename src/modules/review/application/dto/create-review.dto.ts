import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsBoolean, IsArray, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty({ description: 'Product ID' })
  @Type(() => Number)
  @IsInt()
  productId: number;

  @ApiPropertyOptional({ description: 'Order ID' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  orderId?: number;

  @ApiProperty({ description: 'Rating (1-5)', minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Review title', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Review comment' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Review images', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Is verified purchase', default: false })
  @Type(() => Boolean)
  @IsBoolean()
  isVerified: boolean;
}


