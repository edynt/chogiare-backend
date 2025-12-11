import { IsNotEmpty, IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New order status',
    enum: OrderStatus,
  })
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;

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
