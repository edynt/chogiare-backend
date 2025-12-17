import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from '@modules/notification/application/services/notification.service';
import { CreateNotificationDto } from '@modules/notification/application/dto/create-notification.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Admin Notifications')
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
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
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }
}

