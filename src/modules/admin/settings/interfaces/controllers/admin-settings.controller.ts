import { Controller, Get, Put, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '@common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AdminSettingsService } from '../../application/services/admin-settings.service';
import { UpdateSettingsCategoryDto } from '../../application/dto/system-settings.dto';

@ApiTags('Admin - Settings')
@Controller('admin/settings')
@UseGuards(JwtAdminAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system settings' })
  async getAllSettings(@CurrentUser('id') _adminId: number) {
    return {
      success: true,
      data: await this.settingsService.getAllSettings(),
    };
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public settings (no auth required)' })
  async getPublicSettings() {
    return {
      success: true,
      data: await this.settingsService.getPublicSettings(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  async getSystemHealth(@CurrentUser('id') _adminId: number) {
    return {
      success: true,
      data: await this.settingsService.getSystemHealth(),
    };
  }

  @Get(':category')
  @ApiOperation({ summary: 'Get settings by category' })
  @ApiParam({ name: 'category', type: String })
  async getSettingsByCategory(
    @CurrentUser('id') _adminId: number,
    @Param('category') category: string,
  ) {
    return {
      success: true,
      data: await this.settingsService.getSettingsByCategory(category),
    };
  }

  @Put()
  @ApiOperation({ summary: 'Update all system settings' })
  async updateAllSettings(
    @CurrentUser('id') _adminId: number,
    @Body() settings: Record<string, unknown>,
  ) {
    return {
      success: true,
      data: await this.settingsService.updateSettings(settings),
    };
  }

  @Put(':category')
  @ApiOperation({ summary: 'Update settings by category' })
  @ApiParam({ name: 'category', type: String })
  async updateCategorySettings(
    @CurrentUser('id') _adminId: number,
    @Param('category') category: string,
    @Body() settings: Record<string, unknown>,
  ) {
    return {
      success: true,
      data: await this.settingsService.updateCategorySettings(category, settings),
    };
  }

  @Patch('key/:key')
  @ApiOperation({ summary: 'Update a single setting by key' })
  @ApiParam({
    name: 'key',
    type: String,
    description: 'Setting key in format category.settingName',
  })
  async updateSingleSetting(
    @CurrentUser('id') _adminId: number,
    @Param('key') key: string,
    @Body('value') value: unknown,
  ) {
    await this.settingsService.setSetting(key, value);
    return {
      success: true,
      data: await this.settingsService.getSetting(key),
    };
  }
}
