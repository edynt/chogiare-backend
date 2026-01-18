import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
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
import { AdminAuth } from '@common/decorators/admin-auth.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AdminUserService } from '../../application/services/admin-user.service';
import { QueryAdminUserDto } from '../../application/dto/query-admin-user.dto';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { UpdateUserRolesDto } from '../../application/dto/update-user-roles.dto';

@ApiTags('Admin - Users')
@Controller('admin/users')
@AdminAuth()
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

  @Put(':id')
  @ApiOperation({ summary: 'Update user information (Admin only)' })
  async updateUser(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.adminUserService.updateUser(adminId, userId, updateDto);
  }

  @Put(':id/roles')
  @ApiOperation({ summary: 'Update user roles (Admin only)' })
  async updateUserRoles(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateDto: UpdateUserRolesDto,
  ) {
    return this.adminUserService.updateUserRoles(adminId, userId, updateDto);
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  async deleteUser(@CurrentUser('id') adminId: number, @Param('id', ParseIntPipe) userId: number) {
    return this.adminUserService.deleteUser(adminId, userId);
  }
}
