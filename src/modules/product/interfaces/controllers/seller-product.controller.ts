import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductService } from '@modules/product/application/services/product.service';
import { QueryProductDto } from '@modules/product/application/dto/query-product.dto';
import { CreateProductDto } from '@modules/product/application/dto/create-product.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
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
  @ApiOperation({ summary: 'Create a new product' })
  async createProduct(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createProductDto: CreateProductDto,
  ) {
    const product = await this.productService.create(user.id, createProductDto);
    return {
      message: MESSAGES.CREATED,
      data: product,
    };
  }
}
