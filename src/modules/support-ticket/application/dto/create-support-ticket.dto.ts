import { IsString, IsInt, IsOptional, MinLength, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TICKET_CATEGORY_VALUES, TICKET_PRIORITY_VALUES } from '@common/constants/enum.constants';

export class CreateSupportTicketDto {
  @ApiProperty({ description: 'Ticket title', example: 'Sản phẩm bị từ chối không rõ lý do' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  title: string;

  @ApiProperty({ description: 'Ticket description', example: 'Mô tả chi tiết vấn đề...' })
  @IsString()
  @MinLength(2)
  description: string;

  @ApiProperty({ description: 'Category: 0=account, 1=product, 2=payment, 3=technical, 4=report, 5=question, 6=other' })
  @IsInt()
  @IsIn(TICKET_CATEGORY_VALUES)
  category: number;

  @ApiPropertyOptional({ description: 'Priority: 0=low, 1=medium, 2=high, 3=urgent', default: 1 })
  @IsOptional()
  @IsInt()
  @IsIn(TICKET_PRIORITY_VALUES)
  priority?: number;
}
