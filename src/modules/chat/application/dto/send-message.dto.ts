import { IsInt, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';
import { MESSAGE_TYPE_VALUES, MessageTypeValue } from '@common/constants/enum.constants';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'Hello, I am interested in this product',
    maxLength: 10000,
  })
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @MaxLength(10000, { message: VALIDATION_MESSAGES.MAX_LENGTH(10000) })
  content: string;

  @ApiProperty({
    description: 'Message type (0=text, 1=image, 2=file)',
    example: 0,
    enum: MESSAGE_TYPE_VALUES,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @IsIn(MESSAGE_TYPE_VALUES, { message: VALIDATION_MESSAGES.IS_ENUM })
  messageType?: MessageTypeValue;
}
