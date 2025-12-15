import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';
import { MessageType } from '@prisma/client';

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
    description: 'Message type',
    example: 'text',
    enum: MessageType,
    default: MessageType.text,
    required: false,
  })
  @IsOptional()
  @IsEnum(MessageType, { message: VALIDATION_MESSAGES.IS_ENUM })
  messageType?: MessageType;
}
