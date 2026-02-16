import { Controller, Post, Get, Param, Body, Query, UseGuards, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { MESSAGES } from '@common/constants/messages.constants';
import { SupportTicketService } from '../../application/services/support-ticket.service';
import { CreateSupportTicketDto } from '../../application/dto/create-support-ticket.dto';
import { QuerySupportTicketDto } from '../../application/dto/query-support-ticket.dto';
import { ReplySupportTicketDto } from '../../application/dto/reply-support-ticket.dto';

@ApiTags('Support Tickets')
@Controller('support-tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new support ticket' })
  async create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateSupportTicketDto,
  ) {
    const data = await this.supportTicketService.create(userId, dto);
    return {
      message: MESSAGES.SUCCESS,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get my support tickets' })
  async getMyTickets(
    @CurrentUser('id') userId: number,
    @Query() query: QuerySupportTicketDto,
  ) {
    const data = await this.supportTicketService.getMyTickets(userId, query);
    return {
      message: MESSAGES.SUCCESS,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get support ticket by ID' })
  async getById(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) ticketId: number,
  ) {
    const data = await this.supportTicketService.getById(ticketId, userId);
    return {
      message: MESSAGES.SUCCESS,
      data,
    };
  }

  @Post(':id/replies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reply to own support ticket' })
  async reply(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) ticketId: number,
    @Body() dto: ReplySupportTicketDto,
  ) {
    const data = await this.supportTicketService.reply(ticketId, userId, dto.message);
    return {
      message: MESSAGES.SUCCESS,
      data,
    };
  }
}
