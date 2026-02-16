import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplySupportTicketDto {
  @ApiProperty({ description: 'Reply message' })
  @IsString()
  @MinLength(1)
  message: string;
}
