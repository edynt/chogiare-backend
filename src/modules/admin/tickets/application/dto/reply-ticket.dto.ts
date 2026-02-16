import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplyTicketDto {
  @ApiProperty({ description: 'Reply message' })
  @IsString()
  @MinLength(1)
  message: string;
}
