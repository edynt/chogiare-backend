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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReviewService } from '@modules/review/application/services/review.service';
import { CreateReviewDto } from '@modules/review/application/dto/create-review.dto';
import { UpdateReviewDto } from '@modules/review/application/dto/update-review.dto';
import { QueryReviewDto } from '@modules/review/application/dto/query-review.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // ============================================================
  // POST ROUTES
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new review' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() createReviewDto: CreateReviewDto) {
    const review = await this.reviewService.create(user.id, createReviewDto);
    return {
      message: MESSAGES.SUCCESS,
      data: review,
    };
  }

  // ============================================================
  // GET STATIC ROUTES (must come BEFORE dynamic :id routes)
  // ============================================================

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'sellerId', required: false, type: Number })
  @ApiQuery({ name: 'rating', required: false, type: Number })
  async findAll(@Query() queryDto: QueryReviewDto) {
    const result = await this.reviewService.findAll(queryDto);
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my reviews' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getMyReviews(@CurrentUser() user: CurrentUserPayload, @Query() queryDto: QueryReviewDto) {
    const result = await this.reviewService.findAll({
      ...queryDto,
      userId: user.id,
    });
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('eligibility/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check if user can review a product' })
  @ApiParam({ name: 'productId', type: String })
  async checkEligibility(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const result = await this.reviewService.checkEligibility(user.id, productId);
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @Public()
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get review statistics' })
  async getStats() {
    const stats = await this.reviewService.getStats();
    return {
      message: MESSAGES.SUCCESS,
      data: stats,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/my')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my review statistics' })
  async getMyStats(@CurrentUser() user: CurrentUserPayload) {
    const stats = await this.reviewService.getStats(undefined, undefined, user.id);
    return {
      message: MESSAGES.SUCCESS,
      data: stats,
    };
  }

  @Public()
  @Get('stats/product/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get product review statistics' })
  @ApiParam({ name: 'productId', type: String })
  async getProductStats(@Param('productId', ParseIntPipe) productId: number) {
    const stats = await this.reviewService.getStats(productId);
    return {
      message: MESSAGES.SUCCESS,
      data: stats,
    };
  }

  @Public()
  @Get('product/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get reviews by product ID' })
  @ApiParam({ name: 'productId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getProductReviews(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() queryDto: QueryReviewDto,
  ) {
    const result = await this.reviewService.findAll({
      ...queryDto,
      productId,
    });
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @Public()
  @Get('seller/:sellerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get reviews by seller ID' })
  @ApiParam({ name: 'sellerId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getSellerReviews(
    @Param('sellerId', ParseIntPipe) sellerId: number,
    @Query() queryDto: QueryReviewDto,
  ) {
    const result = await this.reviewService.findAll({
      ...queryDto,
      sellerId,
    });
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  // ============================================================
  // GET DYNAMIC ROUTES (must come AFTER static routes)
  // ============================================================

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const review = await this.reviewService.findOne(id);
    return {
      message: MESSAGES.SUCCESS,
      data: review,
    };
  }

  // ============================================================
  // PUT ROUTES
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update review' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    const review = await this.reviewService.update(id, user.id, updateReviewDto);
    return {
      message: MESSAGES.UPDATED,
      data: review,
    };
  }

  // ============================================================
  // DELETE ROUTES
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete review' })
  @ApiParam({ name: 'id', type: String })
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    await this.reviewService.delete(id, user.id);
    return {
      message: MESSAGES.DELETED,
    };
  }
}
