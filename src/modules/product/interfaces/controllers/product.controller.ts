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
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID (public)' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: CurrentUserPayload) {
    return await this.productService.findOne(id, user?.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new product (Seller/Admin only)' })
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
