import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsUrl,
  MaxLength,
  IsInt,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { NOTIFICATION_TYPE_VALUES, NotificationTypeValue } from '@common/constants/enum.constants';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Type of notification (0=order, 1=product, 2=payment, 3=system, 4=promotion, 5=message)',
    enum: NOTIFICATION_TYPE_VALUES,
  })
  @Type(() => Number)
  @IsInt()
  @IsIn(NOTIFICATION_TYPE_VALUES)
  type: NotificationTypeValue;

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
