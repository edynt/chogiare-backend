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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AdminProductService } from '../../application/services/admin-product.service';
import { QueryAdminProductDto } from '../../application/dto/query-admin-product.dto';

@ApiTags('Admin - Products')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminProductController {
  constructor(private readonly adminProductService: AdminProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products (Admin only)' })
  async getProducts(@CurrentUser('id') adminId: number, @Query() queryDto: QueryAdminProductDto) {
    return this.adminProductService.getProducts(adminId, queryDto);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve product (Admin only)' })
  async approveProduct(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) productId: number,
  ) {
    return this.adminProductService.approveProduct(adminId, productId);
  }

  @Put(':id/suspend')
  @ApiOperation({ summary: 'Suspend product (Admin only)' })
  async suspendProduct(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) productId: number,
  ) {
    return this.adminProductService.suspendProduct(adminId, productId);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activate suspended product (Admin only)' })
  async activateProduct(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) productId: number,
  ) {
    return this.adminProductService.activateProduct(adminId, productId);
  }

  @Post('bulk-approve')
  @ApiOperation({ summary: 'Bulk approve products (Admin only)' })
  async bulkApproveProducts(
    @CurrentUser('id') adminId: number,
    @Body() body: { productIds: number[] },
  ) {
    return this.adminProductService.bulkApproveProducts(adminId, body.productIds);
  }
}
