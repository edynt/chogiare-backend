import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTicketStatusDto {
  @ApiProperty({ description: 'New status: open, in_progress, pending, resolved, closed' })
  @IsString()
  @IsIn(['open', 'in_progress', 'pending', 'resolved', 'closed'])
  status: string;
}
