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
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../../../../../common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '../../../../../common/guards/roles.guard';
import { Roles } from '../../../../../common/decorators/roles.decorator';
import { AdminAuth } from '../../../../../common/decorators/admin-auth.decorator';
import { AdminDepositPackagesService } from '../../application/services/admin-deposit-packages.service';
import {
  CreateDepositPackageDto,
  UpdateDepositPackageDto,
  QueryDepositPackageDto,
} from '../../application/dto';

@ApiTags('admin-deposit-packages')
@ApiBearerAuth()
@Controller('admin/deposit-packages')
@AdminAuth()
@UseGuards(JwtAdminAuthGuard, RolesGuard)
@Roles('admin')
export class AdminDepositPackagesController {
  constructor(private readonly depositPackagesService: AdminDepositPackagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all deposit packages with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of deposit packages' })
  async findAll(@Query() query: QueryDepositPackageDto) {
    const queryParams = {
      page: query.page || 1,
      limit: query.limit || 10,
      isActive: query.isActive,
      sortBy: query.sortBy || 'displayOrder',
      sortOrder: query.sortOrder || 'asc',
    };
    return this.depositPackagesService.findAll(queryParams);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single deposit package by ID' })
  @ApiResponse({ status: 200, description: 'Returns deposit package details' })
  @ApiResponse({ status: 404, description: 'Deposit package not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.depositPackagesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new deposit package' })
  @ApiResponse({ status: 201, description: 'Deposit package created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate name' })
  async create(@Body() createDto: CreateDepositPackageDto) {
    return this.depositPackagesService.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing deposit package' })
  @ApiResponse({ status: 200, description: 'Deposit package updated successfully' })
  @ApiResponse({ status: 404, description: 'Deposit package not found' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate name' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateDepositPackageDto) {
    return this.depositPackagesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a deposit package (deactivate)' })
  @ApiResponse({ status: 200, description: 'Deposit package deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Deposit package not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.depositPackagesService.remove(id);
  }
}
