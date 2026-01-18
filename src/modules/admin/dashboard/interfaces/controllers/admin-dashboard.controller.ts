import { Controller, Get, Post, Query, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '@common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AdminAuth } from '@common/decorators/admin-auth.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AdminDashboardService } from '../../application/services/admin-dashboard.service';

@ApiTags('Admin - Dashboard')
@Controller('admin/dashboard')
@AdminAuth()
@UseGuards(JwtAdminAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getStats(@CurrentUser('id') _adminId: number) {
    return {
      success: true,
      data: await this.adminDashboardService.getStats(),
    };
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get recent activities' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentActivities(
    @CurrentUser('id') _adminId: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return {
      success: true,
      data: await this.adminDashboardService.getRecentActivities(limit || 10),
    };
  }

  @Get('top-sellers')
  @ApiOperation({ summary: 'Get top sellers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopSellers(
    @CurrentUser('id') _adminId: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return {
      success: true,
      data: await this.adminDashboardService.getTopSellers(limit || 5),
    };
  }

  @Get('header-notifications')
  @ApiOperation({ summary: 'Get admin header notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHeaderNotifications(
    @CurrentUser('id') _adminId: number,
    @Query('limit') limit?: number,
  ) {
    return {
      success: true,
      data: await this.adminDashboardService.getHeaderNotifications(limit || 10),
    };
  }

  @Post('header-notifications/:id/read')
  @ApiOperation({ summary: 'Mark a header notification as read' })
  @ApiParam({ name: 'id', type: String })
  async markNotificationAsRead(
    @CurrentUser('id') _adminId: number,
    @Param('id') notificationId: string,
  ) {
    return {
      success: true,
      data: await this.adminDashboardService.markNotificationAsRead(notificationId),
    };
  }

  @Post('header-notifications/read-all')
  @ApiOperation({ summary: 'Mark all header notifications as read' })
  async markAllNotificationsAsRead(@CurrentUser('id') _adminId: number) {
    return {
      success: true,
      data: await this.adminDashboardService.markAllNotificationsAsRead(),
    };
  }
}
