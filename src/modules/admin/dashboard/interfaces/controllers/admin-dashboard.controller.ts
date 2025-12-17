import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AdminDashboardService } from '../../application/services/admin-dashboard.service';

@ApiTags('Admin - Dashboard')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
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
}

