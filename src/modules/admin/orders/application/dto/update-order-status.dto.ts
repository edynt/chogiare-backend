import { IsNotEmpty, IsInt, IsIn, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ORDER_STATUS_VALUES, OrderStatusType } from '@common/constants/enum.constants';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New order status (0=pending, 1=confirmed, 2=preparing, 3=ready_for_pickup, 4=completed, 5=cancelled, 6=refunded)',
    enum: ORDER_STATUS_VALUES,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @IsIn(ORDER_STATUS_VALUES)
  status: OrderStatusType;

  @ApiProperty({
    description: 'Admin notes',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}
