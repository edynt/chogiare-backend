import { IsEnum, IsNotEmpty } from 'class-validator';
import { ProductStatus } from '../../domain/entities/product.entity';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class UpdateStatusDto {
  @IsEnum(ProductStatus, { message: VALIDATION_MESSAGES.PRODUCT_STATUS.IS_INVALID })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.PRODUCT_STATUS.IS_REQUIRED })
  status: ProductStatus;
}

