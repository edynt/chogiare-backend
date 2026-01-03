import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StoreService } from '@modules/store/application/services/store.service';
import { CreateStoreDto } from '@modules/store/application/dto/create-store.dto';
import { UpdateStoreDto } from '@modules/store/application/dto/update-store.dto';
import { QueryStoreDto } from '@modules/store/application/dto/query-store.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Stores')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all stores' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(@Query() queryDto: QueryStoreDto) {
    const result = await this.storeService.findAll(queryDto);
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @Public()
  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search stores' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async search(@Query('q') query: string, @Query() queryDto: QueryStoreDto) {
    const result = await this.storeService.findAll({
      ...queryDto,
      search: query,
    });
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get store by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    const store = await this.storeService.findOne(parseInt(id, 10));
    return {
      message: MESSAGES.SUCCESS,
      data: store,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my store' })
  async getMyStore(@CurrentUser() user: CurrentUserPayload) {
    const store = await this.storeService.findByUserId(user.id);
    return {
      message: MESSAGES.SUCCESS,
      data: store,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new store' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() createStoreDto: CreateStoreDto) {
    const store = await this.storeService.create(user.id, createStoreDto);
    return {
      message: MESSAGES.STORE.CREATED,
      data: store,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update store' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    const store = await this.storeService.update(parseInt(id, 10), user.id, updateStoreDto);
    return {
      message: MESSAGES.STORE.UPDATED,
      data: store,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete store' })
  @ApiParam({ name: 'id', type: String })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.storeService.delete(parseInt(id, 10), user.id);
    return {
      message: MESSAGES.STORE.DELETED,
    };
  }

  @Public()
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get store statistics' })
  async getStats() {
    const stats = await this.storeService.getStats();
    return {
      message: MESSAGES.STORE.STATS_RETRIEVED,
      data: stats,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/my')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my store statistics' })
  async getMyStats(@CurrentUser() user: CurrentUserPayload) {
    const store = await this.storeService.findByUserId(user.id);
    const storeId = typeof store.id === 'string' ? parseInt(store.id, 10) : store.id;
    const stats = await this.storeService.getStats(storeId);
    return {
      message: MESSAGES.STORE.STATS_RETRIEVED,
      data: stats,
    };
  }

  @Public()
  @Get('stats/:storeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get store statistics by ID' })
  @ApiParam({ name: 'storeId', type: String })
  async getStoreStats(@Param('storeId') storeId: string) {
    const stats = await this.storeService.getStats(parseInt(storeId, 10));
    return {
      message: MESSAGES.STORE.STATS_RETRIEVED,
      data: stats,
    };
  }

  @Public()
  @Get(':id/products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get products by store ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getProductsByStore(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.storeService.getProductsByStore(parseInt(id, 10), {
      page,
      pageSize,
      status,
      search,
    });
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/stats')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get seller dashboard statistics' })
  async getDashboardStats(@CurrentUser() user: CurrentUserPayload) {
    const store = await this.storeService.findByUserId(user.id);
    if (!store) {
      throw new NotFoundException(MESSAGES.STORE.NOT_FOUND);
    }
    const storeId = typeof store.id === 'string' ? parseInt(store.id, 10) : store.id;
    const stats = await this.storeService.getDashboardStats(storeId);
    return {
      message: MESSAGES.SUCCESS,
      data: stats,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/low-stock')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get low stock products for seller dashboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLowStockProducts(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    const store = await this.storeService.findByUserId(user.id);
    if (!store) {
      throw new NotFoundException(MESSAGES.STORE.NOT_FOUND);
    }
    const storeId = typeof store.id === 'string' ? parseInt(store.id, 10) : store.id;
    const products = await this.storeService.getLowStockProducts(storeId, limit || 20);
    return {
      message: MESSAGES.SUCCESS,
      data: products,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/promoted')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get promoted products for seller dashboard' })
  async getPromotedProducts(@CurrentUser() user: CurrentUserPayload) {
    const store = await this.storeService.findByUserId(user.id);
    if (!store) {
      throw new NotFoundException(MESSAGES.STORE.NOT_FOUND);
    }
    const storeId = typeof store.id === 'string' ? parseInt(store.id, 10) : store.id;
    const products = await this.storeService.getPromotedProducts(storeId);
    return {
      message: MESSAGES.SUCCESS,
      data: products,
    };
  }
}
