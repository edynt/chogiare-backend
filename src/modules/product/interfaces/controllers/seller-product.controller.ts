import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from '@modules/product/application/services/product.service';
import { QueryProductDto } from '@modules/product/application/dto/query-product.dto';
import { CreateProductDto } from '@modules/product/application/dto/create-product.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '@common/decorators/current-user.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Seller - Products')
@Controller('seller/products')
@UseGuards(JwtAuthGuard)
export class SellerProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get seller products' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'active', 'sold', 'archived', 'suspended'],
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getMyProducts(@CurrentUser() user: CurrentUserPayload, @Query() queryDto: QueryProductDto) {
    const result = await this.productService.getSellerProducts(user.id, queryDto);
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new product with images (multipart)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'iPhone 15 Pro Max' },
        description: { type: 'string' },
        categoryId: { type: 'number', example: 1 },
        price: { type: 'number', example: 25000000 },
        originalPrice: { type: 'number', example: 30000000 },
        condition: { type: 'string', enum: ['new', 'like_new', 'good', 'fair', 'poor'] },
        location: { type: 'string' },
        stock: { type: 'number', example: 100 },
        minStock: { type: 'number' },
        maxStock: { type: 'number' },
        costPrice: { type: 'number' },
        sellingPrice: { type: 'number' },
        sku: { type: 'string' },
        barcode: { type: 'string' },
        storeId: { type: 'number' },
        tags: {
          type: 'string',
          description: 'Comma-separated tags (e.g. "smartphone,apple,iphone")',
        },
        badges: { type: 'string', description: 'Comma-separated badges (e.g. "NEW,FEATURED")' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Product images (max 10, max 5MB each)',
        },
      },
      required: ['title', 'categoryId', 'price', 'condition', 'stock'],
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10))
  async createProduct(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createProductDto: CreateProductDto,
  ) {
    const product = await this.productService.create(user.id, createProductDto, files);
    return {
      message: MESSAGES.CREATED,
      data: product,
    };
  }
}
