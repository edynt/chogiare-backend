import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ShippingService } from '@modules/shipping/application/services/shipping.service';
import {
  UpdateShippingDto,
  AddShippingHistoryDto,
} from '@modules/shipping/application/dto/update-shipping.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  // ============================================================
  // GET STATIC ROUTES (must come BEFORE dynamic routes)
  // ============================================================

  @Public()
  @Get('track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track shipment by tracking number (public)' })
  @ApiQuery({ name: 'trackingNumber', required: true, type: String })
  async trackByTrackingNumber(@Query('trackingNumber') trackingNumber: string) {
    const shipping = await this.shippingService.trackByTrackingNumber(trackingNumber);
    return {
      message: MESSAGES.SUCCESS,
      data: shipping,
    };
  }

  // ============================================================
  // GET DYNAMIC ROUTES
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get shipping by order ID' })
  @ApiParam({ name: 'orderId', type: Number })
  async getShippingByOrderId(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser('id') userId: number,
  ) {
    const shipping = await this.shippingService.getShippingByOrderId(orderId, userId);
    return {
      message: MESSAGES.SUCCESS,
      data: shipping,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId/history')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get shipping history for order' })
  @ApiParam({ name: 'orderId', type: Number })
  async getShippingHistory(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser('id') userId: number,
  ) {
    const history = await this.shippingService.getShippingHistory(orderId, userId);
    return {
      message: MESSAGES.SUCCESS,
      data: history,
    };
  }

  // ============================================================
  // PUT/POST ROUTES
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @Put('order/:orderId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update shipping information (store owner only)' })
  @ApiParam({ name: 'orderId', type: Number })
  async updateShipping(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser('id') userId: number,
    @Body() updateDto: UpdateShippingDto,
  ) {
    const shipping = await this.shippingService.updateShipping(orderId, userId, updateDto);
    return {
      message: MESSAGES.UPDATED,
      data: shipping,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('order/:orderId/history')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add shipping history entry (store owner only)' })
  @ApiParam({ name: 'orderId', type: Number })
  async addShippingHistory(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser('id') userId: number,
    @Body() historyDto: AddShippingHistoryDto,
  ) {
    const history = await this.shippingService.addShippingHistory(orderId, userId, historyDto);
    return {
      message: MESSAGES.CREATED,
      data: history,
    };
  }
}
