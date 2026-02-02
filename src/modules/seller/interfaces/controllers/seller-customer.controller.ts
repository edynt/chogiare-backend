import {
  Controller,
  Get,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SellerCustomerService } from '@modules/seller/application/services/seller-customer.service';
import { QuerySellerCustomerDto } from '@modules/seller/application/dto/query-seller-customer.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '@common/decorators/current-user.decorator';

@ApiTags('Seller - Customers')
@Controller('seller/customers')
@UseGuards(JwtAuthGuard)
export class SellerCustomerController {
  constructor(private readonly sellerCustomerService: SellerCustomerService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get seller customers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getCustomers(
    @CurrentUser() user: CurrentUserPayload,
    @Query() queryDto: QuerySellerCustomerDto,
  ) {
    // Use seller ID directly (user.id) instead of looking up store
    return await this.sellerCustomerService.getCustomers(user.id, queryDto);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get customer statistics' })
  async getCustomerStats(@CurrentUser() user: CurrentUserPayload) {
    return await this.sellerCustomerService.getCustomerStats(user.id);
  }

  @Get(':customerId/orders')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get customer orders' })
  @ApiParam({ name: 'customerId', type: Number, description: 'Customer ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getCustomerOrders(
    @CurrentUser() user: CurrentUserPayload,
    @Param('customerId', ParseIntPipe) customerId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return await this.sellerCustomerService.getCustomerOrders(user.id, customerId, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}
