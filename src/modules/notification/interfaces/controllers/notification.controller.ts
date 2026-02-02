import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NotificationService } from '@modules/notification/application/services/notification.service';
import { QueryNotificationDto } from '@modules/notification/application/dto/query-notification.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '@common/decorators/current-user.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['order', 'product', 'payment', 'system', 'promotion', 'message'],
  })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  async getNotifications(
    @CurrentUser() user: CurrentUserPayload,
    @Query() queryDto: QueryNotificationDto,
  ) {
    const result = await this.notificationService.getNotifications(user.id, queryDto);
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.notificationService.getUnreadCount(user.id);
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', type: String })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    const result = await this.notificationService.markAsRead(parseInt(id, 10), user.id);
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.notificationService.markAllAsRead(user.id);
    return {
      message: MESSAGES.SUCCESS,
      data: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', type: String })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.notificationService.delete(parseInt(id, 10), user.id);
    return {
      message: MESSAGES.DELETED,
    };
  }
}
