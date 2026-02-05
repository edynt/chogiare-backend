import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '@common/decorators/current-user.decorator';
import { SellerDashboardService } from '../../application/services/seller-dashboard.service';

@ApiTags('Seller - Dashboard')
@Controller('seller')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SellerDashboardController {
  constructor(private readonly sellerDashboardService: SellerDashboardService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get seller dashboard statistics' })
  async getDashboardStats(@CurrentUser() user: CurrentUserPayload) {
    return {
      success: true,
      data: await this.sellerDashboardService.getDashboardStats(user.id),
    };
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get seller revenue statistics (completed orders only)' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getRevenueStats(
    @CurrentUser() user: CurrentUserPayload,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return {
      success: true,
      data: await this.sellerDashboardService.getRevenueStats(user.id, {
        period,
        startDate,
        endDate,
      }),
    };
  }
}
