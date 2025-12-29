import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '@common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AdminUserService } from '../../application/services/admin-user.service';
import { QueryAdminUserDto } from '../../application/dto/query-admin-user.dto';

@ApiTags('Admin - Users')
@Controller('admin/users')
@UseGuards(JwtAdminAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  async getUsers(@CurrentUser('id') adminId: number, @Query() queryDto: QueryAdminUserDto) {
    return this.adminUserService.getUsers(adminId, queryDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  async getUserStatistics(@CurrentUser('id') adminId: number) {
    return this.adminUserService.getUserStatistics(adminId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  async getUserById(@CurrentUser('id') adminId: number, @Param('id', ParseIntPipe) userId: number) {
    return this.adminUserService.getUserById(adminId, userId);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve user (Admin only)' })
  async approveUser(@CurrentUser('id') adminId: number, @Param('id', ParseIntPipe) userId: number) {
    return this.adminUserService.approveUser(adminId, userId);
  }

  @Put(':id/suspend')
  @ApiOperation({ summary: 'Suspend user (Admin only)' })
  async suspendUser(@CurrentUser('id') adminId: number, @Param('id', ParseIntPipe) userId: number) {
    return this.adminUserService.suspendUser(adminId, userId);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  async activateUser(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) userId: number,
  ) {
    return this.adminUserService.activateUser(adminId, userId);
  }

  @Post('bulk-approve')
  @ApiOperation({ summary: 'Bulk approve users (Admin only)' })
  async bulkApproveUsers(@CurrentUser('id') adminId: number, @Body() body: { userIds: number[] }) {
    return this.adminUserService.bulkApproveUsers(adminId, body.userIds);
  }

  @Post('bulk-suspend')
  @ApiOperation({ summary: 'Bulk suspend users (Admin only)' })
  async bulkSuspendUsers(@CurrentUser('id') adminId: number, @Body() body: { userIds: number[] }) {
    return this.adminUserService.bulkSuspendUsers(adminId, body.userIds);
  }
}
