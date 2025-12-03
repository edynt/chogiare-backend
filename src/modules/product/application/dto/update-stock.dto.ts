import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class UpdateStockDto {
  @IsNumber({}, { message: VALIDATION_MESSAGES.STOCK.IS_NUMBER })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.STOCK.IS_REQUIRED })
  @Min(0, { message: VALIDATION_MESSAGES.STOCK.MIN })
  stock: number;
}

