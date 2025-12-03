import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from '../../application/services/order.service';
import { CreateOrderDto } from '../../application/dto/create-order.dto';
import { UpdateOrderDto } from '../../application/dto/update-order.dto';
import { QueryOrderDto } from '../../application/dto/query-order.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.create(userId, createOrderDto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query() queryDto: QueryOrderDto,
  ) {
    return this.orderService.findAll(userId, queryDto, false);
  }

  @Get('my')
  getMyOrders(
    @CurrentUser('id') userId: string,
    @Query() queryDto: QueryOrderDto,
  ) {
    return this.orderService.findAll(userId, queryDto, false);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.orderService.findOne(id, userId, false);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, userId, updateOrderDto, false);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.orderService.cancel(id, userId);
  }
}

