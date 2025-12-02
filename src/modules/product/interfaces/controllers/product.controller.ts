import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product.use-case';
import { CreateProductDto } from '../../application/dto/create-product.dto';
import { UpdateProductDto } from '../../application/dto/update-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';

@Controller('v1/products')
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProductDto,
  ): Promise<{ status: string; message: string; data: ProductResponseDto }> {
    const product = await this.createProductUseCase.execute(userId, dto);
    return {
      status: 'success',
      message: 'Product created successfully',
      data: ProductResponseDto.fromDomain(product),
    };
  }

  @Get()
  async list(
    @Query() query: any,
  ): Promise<{ status: string; data: PaginatedResponseDto<ProductResponseDto> }> {
    const result = await this.listProductsUseCase.execute(query);
    return {
      status: 'success',
      data: {
        items: result.items.map((p) => ProductResponseDto.fromDomain(p)),
        total: result.total,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        totalPages: Math.ceil(result.total / (query.pageSize || 20)),
      },
    };
  }

  @Get('featured')
  async getFeatured(
    @Query('limit') limit?: number,
  ): Promise<{ status: string; data: ProductResponseDto[] }> {
    const products = await this.listProductsUseCase.getFeatured(limit || 10);
    return {
      status: 'success',
      data: products.map((p) => ProductResponseDto.fromDomain(p)),
    };
  }

  @Get('search')
  async search(
    @Query() query: any,
  ): Promise<{ status: string; data: PaginatedResponseDto<ProductResponseDto> }> {
    const result = await this.listProductsUseCase.search(query.query, query);
    return {
      status: 'success',
      data: {
        items: result.items.map((p) => ProductResponseDto.fromDomain(p)),
        total: result.total,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        totalPages: Math.ceil(result.total / (query.pageSize || 20)),
      },
    };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  async getMyProducts(
    @CurrentUser('id') userId: string,
    @Query() query: any,
  ): Promise<{ status: string; data: PaginatedResponseDto<ProductResponseDto> }> {
    const result = await this.listProductsUseCase.findBySeller(userId, query);
    return {
      status: 'success',
      data: {
        items: result.items.map((p) => ProductResponseDto.fromDomain(p)),
        total: result.total,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        totalPages: Math.ceil(result.total / (query.pageSize || 20)),
      },
    };
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
  ): Promise<{ status: string; data: ProductResponseDto }> {
    const product = await this.getProductUseCase.execute(id);
    return {
      status: 'success',
      data: ProductResponseDto.fromDomain(product),
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProductDto,
  ): Promise<{ status: string; message: string; data: ProductResponseDto }> {
    const product = await this.updateProductUseCase.execute(id, userId, dto);
    return {
      status: 'success',
      message: 'Product updated successfully',
      data: ProductResponseDto.fromDomain(product),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.deleteProductUseCase.execute(id, userId);
  }
}


