import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class UpdateCartItemDto {
  @IsNumber({}, { message: VALIDATION_MESSAGES.QUANTITY.IS_NUMBER })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.QUANTITY.IS_REQUIRED })
  @Min(1, { message: VALIDATION_MESSAGES.QUANTITY.MIN })
  quantity: number;
}

