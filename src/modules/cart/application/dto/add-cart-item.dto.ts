import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class AddCartItemDto {
  @IsString({ message: VALIDATION_MESSAGES.PRODUCT_ID.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.PRODUCT_ID.IS_REQUIRED })
  productId: string;

  @IsNumber({}, { message: VALIDATION_MESSAGES.QUANTITY.IS_NUMBER })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.QUANTITY.IS_REQUIRED })
  @Min(1, { message: VALIDATION_MESSAGES.QUANTITY.MIN })
  quantity: number;
}

