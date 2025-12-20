import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ReportsService } from '../../application/services/reports.service';
import { QueryRevenueReportDto } from '../../application/dto/query-revenue-report.dto';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue/overview')
  @ApiOperation({ summary: 'Get revenue overview statistics' })
  async getRevenueOverview(
    @CurrentUser('id') userId: number,
    @Query() queryDto: QueryRevenueReportDto,
  ) {
    return {
      success: true,
      data: await this.reportsService.getRevenueOverview(
        queryDto.storeId,
        queryDto.timeRange,
        queryDto.dateFrom,
        queryDto.dateTo,
      ),
    };
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue data by date' })
  async getRevenueData(
    @CurrentUser('id') userId: number,
    @Query() queryDto: QueryRevenueReportDto,
  ) {
    return {
      success: true,
      data: await this.reportsService.getRevenueData(
        queryDto.storeId,
        queryDto.timeRange,
        queryDto.dateFrom,
        queryDto.dateTo,
      ),
    };
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopProducts(
    @CurrentUser('id') userId: number,
    @Query() queryDto: QueryRevenueReportDto,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return {
      success: true,
      data: await this.reportsService.getTopProducts(
        queryDto.storeId,
        queryDto.timeRange,
        queryDto.dateFrom,
        queryDto.dateTo,
        limit || 5,
      ),
    };
  }

  @Get('category-revenue')
  @ApiOperation({ summary: 'Get revenue by category' })
  async getCategoryRevenue(
    @CurrentUser('id') userId: number,
    @Query() queryDto: QueryRevenueReportDto,
  ) {
    return {
      success: true,
      data: await this.reportsService.getCategoryRevenue(
        queryDto.storeId,
        queryDto.timeRange,
        queryDto.dateFrom,
        queryDto.dateTo,
      ),
    };
  }
}


