import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { InventoryService } from '@modules/inventory/application/services/inventory.service';
import { StockInDto } from '@modules/inventory/application/dto/stock-in.dto';
import { StockOutDto } from '@modules/inventory/application/dto/stock-out.dto';
import { StockAdjustmentDto } from '@modules/inventory/application/dto/stock-adjustment.dto';
import {
  QueryStockInDto,
  QueryStockAlertDto,
  QueryStockMovementDto,
} from '@modules/inventory/application/dto/query-stock.dto';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('stock-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record stock in' })
  @ApiResponse({ status: 200, description: 'Stock in recorded successfully' })
  async stockIn(@CurrentUser('id') userId: number, @Body() stockInDto: StockInDto) {
    return this.inventoryService.stockIn(userId, stockInDto);
  }

  @Post('stock-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record stock out' })
  @ApiResponse({ status: 200, description: 'Stock out recorded successfully' })
  async stockOut(@CurrentUser('id') userId: number, @Body() stockOutDto: StockOutDto) {
    return this.inventoryService.stockOut(userId, stockOutDto);
  }

  @Put('stock-adjustment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adjust stock quantity' })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  async stockAdjustment(
    @CurrentUser('id') userId: number,
    @Body() adjustmentDto: StockAdjustmentDto,
  ) {
    return this.inventoryService.stockAdjustment(userId, adjustmentDto);
  }

  @Get('stock-in-records')
  @ApiOperation({ summary: 'Get stock in records' })
  @ApiResponse({ status: 200, description: 'Stock in records retrieved successfully' })
  async getStockInRecords(@CurrentUser('id') userId: number, @Query() queryDto: QueryStockInDto) {
    return this.inventoryService.getStockInRecords(userId, queryDto);
  }

  @Get('stock-alerts')
  @ApiOperation({ summary: 'Get stock alerts' })
  @ApiResponse({ status: 200, description: 'Stock alerts retrieved successfully' })
  async getStockAlerts(@CurrentUser('id') userId: number, @Query() queryDto: QueryStockAlertDto) {
    return this.inventoryService.getStockAlerts(userId, queryDto);
  }

  @Put('stock-alerts/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark alert as read' })
  @ApiResponse({ status: 200, description: 'Alert marked as read successfully' })
  async markAlertAsRead(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) alertId: number,
  ) {
    return this.inventoryService.markAlertAsRead(userId, alertId);
  }

  @Put('stock-alerts/read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all alerts as read' })
  @ApiResponse({ status: 200, description: 'All alerts marked as read successfully' })
  async markAllAlertsAsRead(@CurrentUser('id') userId: number) {
    return this.inventoryService.markAllAlertsAsRead(userId);
  }

  @Get('stock-movements')
  @ApiOperation({ summary: 'Get stock movements' })
  @ApiResponse({ status: 200, description: 'Stock movements retrieved successfully' })
  async getStockMovements(
    @CurrentUser('id') userId: number,
    @Query() queryDto: QueryStockMovementDto,
  ) {
    return this.inventoryService.getStockMovements(userId, queryDto);
  }

  @Get('low-stock-products')
  @ApiOperation({ summary: 'Get low stock products' })
  @ApiResponse({ status: 200, description: 'Low stock products retrieved successfully' })
  async getLowStockProducts(@CurrentUser('id') userId: number) {
    return this.inventoryService.getLowStockProducts(userId);
  }

  @Get('products/:productId/stock')
  @ApiOperation({ summary: 'Get product stock information' })
  @ApiResponse({ status: 200, description: 'Stock information retrieved successfully' })
  async getProductStock(
    @CurrentUser('id') userId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.inventoryService.getProductStock(userId, productId);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get inventory reports' })
  @ApiResponse({ status: 200, description: 'Inventory reports retrieved successfully' })
  async getInventoryReports(
    @CurrentUser('id') userId: number,
    @Query('type') type?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.inventoryService.getInventoryReports(userId, type, dateFrom, dateTo);
  }
}
