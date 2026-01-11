import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '@common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AdminModerationProductService } from '../../application/services/admin-moderation-product.service';
import { QueryModerationProductDto } from '../../application/dto/query-moderation-product.dto';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Admin - Moderation Products')
@Controller('admin/moderation/products')
@UseGuards(JwtAdminAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminModerationProductController {
  constructor(private readonly moderationProductService: AdminModerationProductService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get moderation products (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, type: String })
  async getModerationProducts(
    @CurrentUser('id') adminId: number,
    @Query() queryDto: QueryModerationProductDto,
  ) {
    const result = await this.moderationProductService.getModerationProducts(adminId, queryDto);
    return {
      success: true,
      data: result,
      message: MESSAGES.SUCCESS,
    };
  }

  @Put(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve product (Admin only)' })
  async approveProduct(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) productId: number,
  ) {
    const result = await this.moderationProductService.approveProduct(adminId, productId);
    return {
      success: true,
      data: result,
      message: MESSAGES.SUCCESS,
    };
  }

  @Put(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject product (Admin only)' })
  async rejectProduct(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) productId: number,
    @Body() body: { reason?: string },
  ) {
    const result = await this.moderationProductService.rejectProduct(
      adminId,
      productId,
      body?.reason,
    );
    return {
      success: true,
      data: result,
      message: MESSAGES.SUCCESS,
    };
  }

  @Post('bulk-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk approve products (Admin only)' })
  async bulkApproveProducts(
    @CurrentUser('id') adminId: number,
    @Body() body: { productIds: number[] },
  ) {
    const result = await this.moderationProductService.bulkApproveProducts(
      adminId,
      body.productIds,
    );
    return {
      success: true,
      data: result,
      message: MESSAGES.SUCCESS,
    };
  }

  @Post('bulk-reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk reject products (Admin only)' })
  async bulkRejectProducts(
    @CurrentUser('id') adminId: number,
    @Body() body: { productIds: number[]; reason?: string },
  ) {
    const result = await this.moderationProductService.bulkRejectProducts(
      adminId,
      body.productIds,
      body?.reason,
    );
    return {
      success: true,
      data: result,
      message: MESSAGES.SUCCESS,
    };
  }
}
