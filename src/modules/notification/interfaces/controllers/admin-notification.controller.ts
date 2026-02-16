import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from '@modules/notification/application/services/notification.service';
import { CreateNotificationDto } from '@modules/notification/application/dto/create-notification.dto';
import { JwtAdminAuthGuard } from '@common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AdminAuth } from '@common/decorators/admin-auth.decorator';

@ApiTags('Admin Notifications')
@Controller('admin/notifications')
@AdminAuth()
@UseGuards(JwtAdminAuthGuard, RolesGuard)
@Roles('admin')
export class AdminNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create and send notification to users (Admin only)' })
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    const result = await this.notificationService.createNotification(createNotificationDto);
    return {
      success: true,
      data: result,
    };
  }
}
