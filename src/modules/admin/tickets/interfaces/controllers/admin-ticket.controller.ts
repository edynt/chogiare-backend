import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '@common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AdminAuth } from '@common/decorators/admin-auth.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { MESSAGES } from '@common/constants/messages.constants';
import { AdminTicketService } from '../../application/services/admin-ticket.service';
import { QueryAdminTicketDto } from '../../application/dto/query-admin-ticket.dto';
import { UpdateTicketStatusDto } from '../../application/dto/update-ticket-status.dto';
import { ReplyTicketDto } from '../../application/dto/reply-ticket.dto';

@ApiTags('Admin - Support Tickets')
@Controller('admin/tickets')
@AdminAuth()
@UseGuards(JwtAdminAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminTicketController {
  constructor(private readonly adminTicketService: AdminTicketService) {}

  @Get()
  @ApiOperation({ summary: 'Get all support tickets (Admin)' })
  async getTickets(@Query() query: QueryAdminTicketDto) {
    const data = await this.adminTicketService.getTickets(query);
    return { message: MESSAGES.SUCCESS, data };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ticket statistics (Admin)' })
  async getStats() {
    const data = await this.adminTicketService.getStats();
    return { message: MESSAGES.SUCCESS, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket detail (Admin)' })
  async getTicketById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.adminTicketService.getTicketById(id);
    return { message: MESSAGES.SUCCESS, data };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status (Admin)' })
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTicketStatusDto) {
    const data = await this.adminTicketService.updateStatus(id, dto);
    return { message: MESSAGES.SUCCESS, data };
  }

  @Post(':id/replies')
  @ApiOperation({ summary: 'Reply to ticket (Admin)' })
  async replyToTicket(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') adminId: number,
    @Body() dto: ReplyTicketDto,
  ) {
    const data = await this.adminTicketService.replyToTicket(id, adminId, dto.message);
    return { message: MESSAGES.SUCCESS, data };
  }
}
