import { Controller, Get, Post, Param, Query, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AdminPaymentService } from '../../application/services/admin-payment.service';
import { QueryAdminPaymentDto } from '../../application/dto/query-admin-payment.dto';

@ApiTags('Admin - Payments')
@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminPaymentController {
  constructor(private readonly adminPaymentService: AdminPaymentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions (Admin only)' })
  async getTransactions(
    @CurrentUser('id') adminId: number,
    @Query() queryDto: QueryAdminPaymentDto,
  ) {
    return this.adminPaymentService.getTransactions(adminId, queryDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get payment statistics (Admin only)' })
  async getPaymentStatistics(@CurrentUser('id') adminId: number) {
    return this.adminPaymentService.getPaymentStatistics(adminId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID (Admin only)' })
  async getTransactionById(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) transactionId: number,
  ) {
    return this.adminPaymentService.getTransactionById(adminId, transactionId);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund transaction (Admin only)' })
  async refundTransaction(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) transactionId: number,
    @Body() body: { reason?: string },
  ) {
    return this.adminPaymentService.refundTransaction(adminId, transactionId, body.reason);
  }
}
