import { IsEnum, IsOptional, IsBoolean, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NOTIFICATION_TYPE_VALUES, NotificationTypeValue } from '@common/constants/enum.constants';

export class QueryNotificationDto {
  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Notification type (0=order, 1=product, 2=payment, 3=system, 4=promotion, 5=message)',
    enum: NOTIFICATION_TYPE_VALUES,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(NOTIFICATION_TYPE_VALUES)
  type?: NotificationTypeValue;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;
}
