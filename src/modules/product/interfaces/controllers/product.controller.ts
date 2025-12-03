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
} from '@nestjs/common';
import { ProductService } from '../../application/services/product.service';
import { CreateProductDto } from '../../application/dto/create-product.dto';
import { UpdateProductDto } from '../../application/dto/update-product.dto';
import { QueryProductDto } from '../../application/dto/query-product.dto';
import { UpdateStockDto } from '../../application/dto/update-stock.dto';
import { UpdateStatusDto } from '../../application/dto/update-status.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') sellerId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productService.create(sellerId, createProductDto);
  }

  @Get()
  @Public()
  findAll(@Query() queryDto: QueryProductDto) {
    return this.productService.findAll(queryDto);
  }

  @Get('featured')
  @Public()
  getFeatured(@Query('limit') limit?: number) {
    return this.productService.getFeatured(limit ? parseInt(limit.toString()) : 10);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyProducts(
    @CurrentUser('id') sellerId: string,
    @Query() queryDto: QueryProductDto,
  ) {
    return this.productService.getMyProducts(sellerId, queryDto);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    const product = await this.productService.findOne(id);
    // Increment view count asynchronously
    this.productService.incrementView(id).catch(() => {
      // Ignore errors
    });
    return product;
  }

  @Post(':id/views')
  @Public()
  @HttpCode(HttpStatus.OK)
  incrementView(@Param('id') id: string) {
    return this.productService.incrementView(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser('id') sellerId: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, sellerId, updateProductDto, false);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard)
  updateStock(
    @Param('id') id: string,
    @CurrentUser('id') sellerId: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    return this.productService.updateStock(id, sellerId, updateStockDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') sellerId: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.productService.updateStatus(id, sellerId, updateStatusDto, false);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @CurrentUser('id') sellerId: string,
  ) {
    return this.productService.remove(id, sellerId, false);
  }
}

