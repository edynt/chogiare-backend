import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SkipHeaderValidation } from '@common/decorators/skip-header-validation.decorator';
import { OrderService } from '@modules/order/application/services/order.service';
import { CreateOrderDto } from '@modules/order/application/dto/create-order.dto';
import { CreateOrderFromCartDto } from '@modules/order/application/dto/create-order-from-cart.dto';
import { QueryOrderDto } from '@modules/order/application/dto/query-order.dto';
import { UpdateOrderDto } from '@modules/order/application/dto/update-order.dto';
import { UpdatePaymentStatusDto } from '@modules/order/application/dto/update-payment-status.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ============================================================
  // POST ROUTES
  // ============================================================

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

  // ============================================================
  // GET STATIC ROUTES (must come BEFORE dynamic :id routes)
  // ============================================================

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

  @Get('my')
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
  async getUserOrders(@CurrentUser('id') userId: number, @Query() queryDto: QueryOrderDto) {
    const result = await this.orderService.getOrders(userId, queryDto);
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order statistics' })
  async getOrderStats() {
    const stats = await this.orderService.getOrderStats();
    return {
      message: MESSAGES.SUCCESS,
      data: stats,
    };
  }

  @Get('stats/my')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user order statistics' })
  async getUserOrderStats(@CurrentUser('id') userId: number) {
    const stats = await this.orderService.getOrderStats(userId);
    return {
      message: MESSAGES.SUCCESS,
      data: stats,
    };
  }

  @Get('stats/store/:storeId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get store order statistics' })
  @ApiParam({ name: 'storeId', type: String })
  async getStoreOrderStats(@Param('storeId', ParseIntPipe) storeId: number) {
    const stats = await this.orderService.getOrderStats(undefined, storeId);
    return {
      message: MESSAGES.SUCCESS,
      data: stats,
    };
  }

  @Get('seller/my')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get seller orders (orders for products sold by current user)' })
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
  async getSellerOrders(@CurrentUser('id') userId: number, @Query() queryDto: QueryOrderDto) {
    const result = await this.orderService.getSellerOrders(userId, queryDto);
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @Get('store/:storeId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get store orders' })
  @ApiParam({ name: 'storeId', type: String })
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
  async getStoreOrders(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() queryDto: QueryOrderDto,
  ) {
    const result = await this.orderService.getStoreOrders(storeId, queryDto);
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  // ============================================================
  // GET DYNAMIC ROUTES (must come AFTER static routes)
  // ============================================================

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

  // ============================================================
  // PATCH ROUTES
  // ============================================================

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

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'status', required: true, type: String })
  async updateOrderStatus(
    @Param('id', ParseIntPipe) orderId: number,
    @Query('status') status: string,
    @CurrentUser('id') userId: number,
  ) {
    const order = await this.orderService.updateOrderStatus(orderId, status, userId);
    return {
      message: MESSAGES.UPDATED,
      data: order,
    };
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirm order' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'sellerNotes', required: false, type: String })
  async confirmOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @Query('sellerNotes') sellerNotes: string | undefined,
    @CurrentUser('id') userId: number,
  ) {
    const order = await this.orderService.confirmOrder(orderId, sellerNotes, userId);
    return {
      message: MESSAGES.UPDATED,
      data: order,
    };
  }

  @Patch(':id/payment-status')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update payment status' })
  @ApiParam({ name: 'id', type: Number })
  async updatePaymentStatus(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
    @CurrentUser('id') userId: number,
  ) {
    const order = await this.orderService.updatePaymentStatus(
      orderId,
      updatePaymentStatusDto.paymentStatus,
      userId,
      updatePaymentStatusDto.paymentProofUrl,
    );
    return {
      message: MESSAGES.UPDATED,
      data: order,
    };
  }

  @Post(':id/payment-image')
  @SkipHeaderValidation()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload payment proof image for order' })
  @ApiParam({ name: 'id', type: Number })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Payment proof image file',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPaymentImage(
    @Param('id', ParseIntPipe) orderId: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: number,
  ) {
    const order = await this.orderService.uploadPaymentImage(orderId, file, userId);
    return {
      message: MESSAGES.UPDATED,
      data: order,
    };
  }

  // ============================================================
  // PUT ROUTES
  // ============================================================

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update order' })
  @ApiParam({ name: 'id', type: Number })
  async updateOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @CurrentUser('id') userId: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    const order = await this.orderService.updateOrder(orderId, updateOrderDto, userId);
    return {
      message: MESSAGES.UPDATED,
      data: order,
    };
  }
}
