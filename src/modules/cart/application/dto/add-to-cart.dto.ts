import { IsInt, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class AddToCartDto {
  @ApiProperty({
    description: 'Product ID',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @IsPositive({ message: VALIDATION_MESSAGES.POSITIVE })
  productId: number;

  @ApiProperty({
    description: 'Quantity',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  quantity: number;
}
