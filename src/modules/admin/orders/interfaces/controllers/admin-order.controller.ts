import { Controller, Get, Put, Param, Query, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '@common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AdminAuth } from '@common/decorators/admin-auth.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AdminOrderService } from '../../application/services/admin-order.service';
import { QueryAdminOrderDto } from '../../application/dto/query-admin-order.dto';
import { UpdateOrderStatusDto } from '../../application/dto/update-order-status.dto';

@ApiTags('Admin - Orders')
@Controller('admin/orders')
@AdminAuth()
@UseGuards(JwtAdminAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminOrderController {
  constructor(private readonly adminOrderService: AdminOrderService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  async getOrders(@CurrentUser('id') adminId: number, @Query() queryDto: QueryAdminOrderDto) {
    return this.adminOrderService.getOrders(adminId, queryDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get order statistics (Admin only)' })
  async getOrderStatistics(@CurrentUser('id') adminId: number) {
    return this.adminOrderService.getOrderStatistics(adminId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order stats (Admin only)' })
  async getOrderStats(@CurrentUser('id') adminId: number) {
    return this.adminOrderService.getOrderStatistics(adminId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID (Admin only)' })
  async getOrderById(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.adminOrderService.getOrderById(adminId, orderId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  async updateOrderStatus(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) orderId: number,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.adminOrderService.updateOrderStatus(adminId, orderId, updateDto);
  }
}
