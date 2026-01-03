import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ProductService } from '@modules/product/application/services/product.service';
import { CreateProductDto } from '@modules/product/application/dto/create-product.dto';
import { UpdateProductDto } from '@modules/product/application/dto/update-product.dto';
import { QueryProductDto } from '@modules/product/application/dto/query-product.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ============================================================
  // GET STATIC ROUTES (must come BEFORE dynamic :id routes)
  // ============================================================

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all products (public)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'active', 'sold', 'archived', 'suspended'],
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiQuery({ name: 'isPromoted', required: false, type: Boolean })
  async findAll(@Query() queryDto: QueryProductDto, @CurrentUser() user?: CurrentUserPayload) {
    return await this.productService.findAll(queryDto, user?.id);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  async searchProducts(
    @Query('query') query: string,
    @Query() queryDto: QueryProductDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return await this.productService.searchProducts(query, queryDto, user?.id);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFeaturedProducts(@Query('limit') limit?: number) {
    const products = await this.productService.getFeaturedProducts(
      limit ? parseInt(limit.toString(), 10) : 10,
    );
    return {
      message: MESSAGES.SUCCESS,
      data: products,
    };
  }

  // ============================================================
  // GET DYNAMIC ROUTES (must come AFTER static routes)
  // ============================================================

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID (public)' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: CurrentUserPayload) {
    return await this.productService.findOne(id, user?.id);
  }

  @Public()
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiParam({ name: 'id', type: Number })
  async getProductStats(@Param('id', ParseIntPipe) id: number) {
    const stats = await this.productService.getProductStats(id);
    return {
      message: MESSAGES.SUCCESS,
      data: stats,
    };
  }

  // ============================================================
  // POST ROUTES
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new product' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createProductDto: CreateProductDto,
  ) {
    const product = await this.productService.create(user.id, createProductDto);
    return {
      message: MESSAGES.CREATED,
      data: product,
    };
  }

  @Public()
  @Post(':id/views')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Increment product views' })
  @ApiParam({ name: 'id', type: Number })
  async incrementViews(@Param('id', ParseIntPipe) id: number) {
    await this.productService.incrementViews(id);
    return {
      message: MESSAGES.SUCCESS,
    };
  }

  // ============================================================
  // PATCH ROUTES
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update product (Owner/Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const product = await this.productService.update(id, updateProductDto, user.id);
    return {
      message: MESSAGES.UPDATED,
      data: product,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update product status' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({
    name: 'status',
    required: true,
    enum: ['draft', 'active', 'sold', 'archived', 'suspended'],
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const product = await this.productService.updateStatus(id, status, user.id);
    return {
      message: MESSAGES.UPDATED,
      data: product,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/stock')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update product stock' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'stock', required: true, type: Number })
  async updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Query('stock') stock: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const product = await this.productService.updateStock(id, parseInt(stock, 10), user.id);
    return {
      message: MESSAGES.UPDATED,
      data: product,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bulk update products' })
  async bulkUpdate(
    @Body() body: { updates: Array<{ id: number; data: Partial<UpdateProductDto> }> },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const products = await this.productService.bulkUpdate(body.updates, user.id);
    return {
      message: MESSAGES.UPDATED,
      data: products,
    };
  }

  // ============================================================
  // DELETE ROUTES
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete product (Owner/Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    await this.productService.remove(id, user.id);
    return {
      message: MESSAGES.DELETED,
    };
  }
}
