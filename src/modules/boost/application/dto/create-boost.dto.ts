import { IsNotEmpty, IsInt, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class CreateBoostDto {
  @ApiProperty({
    description: 'Product ID to boost',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  productId: number;

  @ApiProperty({
    description: 'Boost package ID',
    example: 'pay-per-view-1000',
  })
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  boostPackageId: string;

  @ApiProperty({
    description: 'Number of days (for pay per day packages)',
    example: 7,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  days?: number;

  @ApiProperty({
    description: 'Target views (for pay per view packages)',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  viewsTarget?: number;
}
