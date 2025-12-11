import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CustomerService } from '@modules/customer/application/services/customer.service';
import { QueryCustomerDto } from '@modules/customer/application/dto/query-customer.dto';
import { UpdateCustomerStatusDto } from '@modules/customer/application/dto/update-customer-status.dto';
import { AssignRoleDto } from '@modules/customer/application/dto/assign-role.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all customers (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: Boolean })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  @ApiQuery({ name: 'role', required: false, type: String })
  async findAll(@Query() queryDto: QueryCustomerDto) {
    return await this.customerService.findAll(queryDto);
  }

  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get customer statistics (Admin only)' })
  async getStatistics() {
    return await this.customerService.getStatistics();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get customer by ID with details (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.customerService.findOne(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update customer status (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateCustomerStatusDto,
  ) {
    const customer = await this.customerService.updateStatus(id, updateStatusDto);
    return {
      message: MESSAGES.CUSTOMER.STATUS_UPDATED,
      data: customer,
    };
  }

  @Patch(':id/roles')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Assign role to customer (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  async assignRole(@Param('id', ParseIntPipe) id: number, @Body() assignRoleDto: AssignRoleDto) {
    return await this.customerService.assignRole(id, assignRoleDto.roleName);
  }

  @Patch(':id/roles/remove')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove role from customer (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  async removeRole(@Param('id', ParseIntPipe) id: number, @Body() assignRoleDto: AssignRoleDto) {
    return await this.customerService.removeRole(id, assignRoleDto.roleName);
  }
}
