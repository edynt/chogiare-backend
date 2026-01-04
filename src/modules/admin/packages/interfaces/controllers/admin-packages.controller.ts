import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '@common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AdminPackagesService } from '../../application/services/admin-packages.service';
import { CreatePackageDto } from '../../application/dto/create-package.dto';
import { UpdatePackageDto } from '../../application/dto/update-package.dto';
import { QueryPackageDto } from '../../application/dto/query-package.dto';

@ApiTags('Admin - Packages')
@Controller('admin/packages')
@UseGuards(JwtAdminAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminPackagesController {
  constructor(private readonly packagesService: AdminPackagesService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get package statistics' })
  @ApiResponse({
    status: 200,
    description: 'Package statistics retrieved successfully',
    schema: {
      example: {
        totalPackages: 10,
        activePackages: 8,
        totalSubscribers: 150,
        monthlyRevenue: 12500.50,
        popularPackage: 'Premium Boost',
      },
    },
  })
  async getPackageStats(@CurrentUser('id') adminId: number) {
    return this.packagesService.getPackageStats(adminId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all service packages with pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of packages retrieved successfully',
    schema: {
      example: {
        items: [
          {
            id: 'abc123',
            name: 'Premium Boost',
            type: 'payPerView',
            price: 99.99,
            description: 'Boost your product visibility',
            config: {},
            isActive: true,
            metadata: {},
            createdAt: 1234567890,
            updatedAt: 1234567890,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      },
    },
  })
  async getPackages(@CurrentUser('id') adminId: number, @Query() query: QueryPackageDto) {
    return this.packagesService.getPackages(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get package by ID' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({
    status: 200,
    description: 'Package details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Package not found',
  })
  async getPackageById(@CurrentUser('id') adminId: number, @Param('id') id: string) {
    return this.packagesService.getPackageById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new service package' })
  @ApiResponse({
    status: 201,
    description: 'Package created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async createPackage(@CurrentUser('id') adminId: number, @Body() dto: CreatePackageDto) {
    return this.packagesService.createPackage(adminId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update package by ID' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({
    status: 200,
    description: 'Package updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Package not found',
  })
  async updatePackage(
    @CurrentUser('id') adminId: number,
    @Param('id') id: string,
    @Body() dto: UpdatePackageDto,
  ) {
    return this.packagesService.updatePackage(adminId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete package by ID' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({
    status: 200,
    description: 'Package deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Package not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Package is in use and cannot be deleted',
  })
  async deletePackage(@CurrentUser('id') adminId: number, @Param('id') id: string) {
    return this.packagesService.deletePackage(adminId, id);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle package active status' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({
    status: 200,
    description: 'Package status toggled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Package not found',
  })
  async togglePackageStatus(@CurrentUser('id') adminId: number, @Param('id') id: string) {
    return this.packagesService.togglePackageStatus(adminId, id);
  }
}
