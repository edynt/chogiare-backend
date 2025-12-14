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
import { CategoryService } from '@modules/category/application/services/category.service';
import { CreateCategoryDto } from '@modules/category/application/dto/create-category.dto';
import { UpdateCategoryDto } from '@modules/category/application/dto/update-category.dto';
import { QueryCategoryDto } from '@modules/category/application/dto/query-category.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/public.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'parentId', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'includeChildren', required: false, type: Boolean })
  async findAll(@Query() queryDto: QueryCategoryDto) {
    return await this.categoryService.findAll(queryDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.categoryService.findOne(id);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiParam({ name: 'slug', type: String })
  async findBySlug(@Param('slug') slug: string) {
    return await this.categoryService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoryService.create(createCategoryDto);
    return {
      message: MESSAGES.CREATED,
      data: category,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update category (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoryService.update(id, updateCategoryDto);
    return {
      message: MESSAGES.UPDATED,
      data: category,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.remove(id);
    return {
      message: MESSAGES.DELETED,
    };
  }

  @Public()
  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Get subcategories' })
  @ApiParam({ name: 'id', type: Number })
  async getSubCategories(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoryService.findAll({ parentId: id, page: 1, pageSize: 1000 });
    return {
      message: MESSAGES.SUCCESS,
      data: result.items,
    };
  }

  @Public()
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiParam({ name: 'id', type: Number })
  async getCategoryStats(@Param('id', ParseIntPipe) id: number) {
    const stats = await this.categoryService.getStats(id);
    return {
      message: MESSAGES.SUCCESS,
      data: stats,
    };
  }

  @Public()
  @Get(':id/products')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getProductsByCategory(
    @Param('id', ParseIntPipe) id: number,
    @Query() queryDto: QueryCategoryDto,
  ) {
    const result = await this.categoryService.getProductsByCategory(id, {
      page: queryDto.page,
      pageSize: queryDto.pageSize,
    });
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }
}
