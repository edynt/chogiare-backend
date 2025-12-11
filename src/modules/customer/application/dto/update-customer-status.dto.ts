import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class UpdateCustomerStatusDto {
  @ApiProperty({
    description: 'Customer status (true = active, false = locked)',
    example: true,
  })
  @IsBoolean({ message: VALIDATION_MESSAGES.IS_BOOLEAN })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  status: boolean;
}
