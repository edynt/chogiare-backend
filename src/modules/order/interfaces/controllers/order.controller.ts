import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrderService } from '@modules/order/application/services/order.service';
import { CreateOrderDto } from '@modules/order/application/dto/create-order.dto';
import { CreateOrderFromCartDto } from '@modules/order/application/dto/create-order-from-cart.dto';
import { QueryOrderDto } from '@modules/order/application/dto/query-order.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('from-cart')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create order from cart items grouped by store' })
  async createOrderFromCart(
    @CurrentUser('id') userId: number,
    @Body() createOrderDto: CreateOrderFromCartDto,
  ) {
    const order = await this.orderService.createOrderFromCart(userId, createOrderDto);
    return {
      message: MESSAGES.ORDER.CREATED,
      data: order,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create order directly' })
  async createOrder(@CurrentUser('id') userId: number, @Body() createOrderDto: CreateOrderDto) {
    const order = await this.orderService.createOrder(userId, createOrderDto);
    return {
      message: MESSAGES.ORDER.CREATED,
      data: order,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled', 'refunded'],
  })
  @ApiQuery({
    name: 'paymentStatus',
    required: false,
    enum: ['pending', 'completed', 'failed', 'refunded'],
  })
  async getOrders(@CurrentUser('id') userId: number, @Query() queryDto: QueryOrderDto) {
    return await this.orderService.getOrders(userId, queryDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: Number })
  async getOrderById(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return await this.orderService.getOrderById(userId, orderId);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', type: Number })
  async cancelOrder(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) orderId: number) {
    const order = await this.orderService.cancelOrder(userId, orderId);
    return {
      message: MESSAGES.ORDER.CANCELLED,
      data: order,
    };
  }
}
