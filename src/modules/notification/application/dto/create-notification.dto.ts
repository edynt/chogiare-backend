import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    enum: ['order', 'product', 'payment', 'system', 'promotion', 'message'],
    description: 'Type of notification',
  })
  @IsEnum(['order', 'product', 'payment', 'system', 'promotion', 'message'])
  type: 'order' | 'product' | 'payment' | 'system' | 'promotion' | 'message';

  @ApiProperty({ maxLength: 200, description: 'Notification title' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ maxLength: 1000, description: 'Notification message' })
  @IsString()
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({ description: 'Action URL when notification is clicked' })
  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Target user IDs (if not all users)' })
  @IsOptional()
  @IsArray()
  targetUserIds?: number[];

  @ApiPropertyOptional({ description: 'Send to all users', default: false })
  @IsOptional()
  @IsBoolean()
  targetAllUsers?: boolean;
}
