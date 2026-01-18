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
import { JwtAdminAuthGuard } from '../../../../../common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '../../../../../common/guards/roles.guard';
import { Roles } from '../../../../../common/decorators/roles.decorator';
import { AdminAuth } from '../../../../../common/decorators/admin-auth.decorator';
import { AdminPackagesService } from '../../application/services';
import { CreatePackageDto, UpdatePackageDto } from '../../application/dto';

@Controller('admin/packages')
@AdminAuth()
@UseGuards(JwtAdminAuthGuard, RolesGuard)
@Roles('admin')
export class AdminPackagesController {
  constructor(private readonly packagesService: AdminPackagesService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('isActive') isActive?: string,
    @Query('sortBy') sortBy?: 'displayOrder' | 'price' | 'durationDays',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const queryParams = {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      sortBy: sortBy || 'displayOrder',
      sortOrder: sortOrder || 'asc',
    };
    return this.packagesService.findAll(queryParams);
  }

  @Get('statistics')
  async getStatistics() {
    return this.packagesService.getStatistics();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.packagesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreatePackageDto) {
    return this.packagesService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdatePackageDto) {
    return this.packagesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.packagesService.remove(id);
  }
}
