import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Other user ID to start conversation with',
    example: 2,
  })
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  otherUserId: number;

  @ApiProperty({
    description: 'Conversation title (optional)',
    example: 'Product inquiry',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH(255) })
  title?: string;
}
