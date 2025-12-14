import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ShippingService } from '@modules/shipping/application/services/shipping.service';
import { UpdateShippingStatusDto } from '@modules/shipping/application/dto/update-shipping-status.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/public.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':orderId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get shipping information by order ID' })
  @ApiParam({ name: 'orderId', type: String })
  async getShippingInfo(@Param('orderId', ParseIntPipe) orderId: number) {
    const shippingInfo = await this.shippingService.getShippingInfo(orderId);
    return {
      message: MESSAGES.SUCCESS,
      data: shippingInfo,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':orderId/history')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get shipping history by order ID' })
  @ApiParam({ name: 'orderId', type: String })
  async getShippingHistory(@Param('orderId', ParseIntPipe) orderId: number) {
    const history = await this.shippingService.getShippingHistory(orderId);
    return {
      message: MESSAGES.SUCCESS,
      data: history,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  @Patch(':orderId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update shipping status' })
  @ApiParam({ name: 'orderId', type: String })
  async updateShippingStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() updateDto: UpdateShippingStatusDto,
  ) {
    const shippingInfo = await this.shippingService.updateShippingStatus(orderId, updateDto);
    return {
      message: MESSAGES.UPDATED,
      data: shippingInfo,
    };
  }

  @Public()
  @Get('track/:trackingNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track package by tracking number' })
  @ApiParam({ name: 'trackingNumber', type: String })
  async trackPackage(@Param('trackingNumber') trackingNumber: string) {
    const shippingInfo = await this.shippingService.trackPackage(trackingNumber);
    return {
      message: MESSAGES.SUCCESS,
      data: shippingInfo,
    };
  }
}


