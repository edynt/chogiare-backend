import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '@common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AdminAnalyticsService } from '../../application/services/admin-analytics.service';

@ApiTags('Admin - Analytics')
@Controller('admin/analytics')
@UseGuards(JwtAdminAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview statistics' })
  @ApiQuery({ name: 'timeRange', required: false, type: String })
  async getOverviewStats(
    @CurrentUser('id') adminId: number,
    @Query('timeRange') timeRange?: string,
  ) {
    return {
      success: true,
      data: await this.adminAnalyticsService.getOverviewStats(timeRange),
    };
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopProducts(
    @CurrentUser('id') adminId: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return {
      success: true,
      data: await this.adminAnalyticsService.getTopProducts(limit || 5),
    };
  }

  @Get('top-sellers')
  @ApiOperation({ summary: 'Get top sellers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopSellers(
    @CurrentUser('id') adminId: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return {
      success: true,
      data: await this.adminAnalyticsService.getTopSellers(limit || 5),
    };
  }

  @Get('category-stats')
  @ApiOperation({ summary: 'Get category statistics' })
  async getCategoryStats(@CurrentUser('id') adminId: number) {
    return {
      success: true,
      data: await this.adminAnalyticsService.getCategoryStats(),
    };
  }
}
