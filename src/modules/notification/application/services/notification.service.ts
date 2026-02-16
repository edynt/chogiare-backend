import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '@modules/notification/domain/repositories/notification.repository.interface';
import { NotificationGateway } from '../../interfaces/gateways/notification.gateway';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { QueryNotificationDto } from '../dto/query-notification.dto';
import { NOTIFICATION_TYPE } from '@common/constants/enum.constants';

const NOTIFICATION_TYPE_MAP: Record<number, string> = {
  [NOTIFICATION_TYPE.ORDER]: 'order',
  [NOTIFICATION_TYPE.PRODUCT]: 'product',
  [NOTIFICATION_TYPE.PAYMENT]: 'payment',
  [NOTIFICATION_TYPE.SYSTEM]: 'system',
  [NOTIFICATION_TYPE.PROMOTION]: 'promotion',
  [NOTIFICATION_TYPE.MESSAGE]: 'message',
};

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async getNotifications(userId: number, queryDto: QueryNotificationDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;

    const result = await this.notificationRepository.findByUserId(userId, {
      type: queryDto.type,
      isRead: queryDto.isRead,
      page,
      pageSize,
    });

    const unreadCount = await this.notificationRepository.countUnreadByUserId(userId);

    return {
      items: result.items.map((notification) => ({
        id: notification.id.toString(),
        type: NOTIFICATION_TYPE_MAP[notification.type] || 'system',
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toString(),
        actionUrl: notification.actionUrl,
        metadata: notification.metadata,
      })),
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
      unreadCount,
    };
  }

  async getUnreadCount(userId: number) {
    const count = await this.notificationRepository.countUnreadByUserId(userId);
    return {
      unreadCount: count,
    };
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundException({
        message: MESSAGES.NOT_FOUND,
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    if (notification.userId !== userId) {
      throw new BadRequestException({
        message: MESSAGES.FORBIDDEN,
        errorCode: ERROR_CODES.FORBIDDEN,
      });
    }

    await this.notificationRepository.markAsRead(id, userId);
    const unreadCount = await this.notificationRepository.countUnreadByUserId(userId);

    return {
      success: true,
      unreadCount,
    };
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepository.markAllAsRead(userId);
    const unreadCount = await this.notificationRepository.countUnreadByUserId(userId);

    return {
      success: true,
      unreadCount,
    };
  }

  async delete(id: number, userId: number) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundException({
        message: MESSAGES.NOT_FOUND,
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    if (notification.userId !== userId) {
      throw new BadRequestException({
        message: MESSAGES.FORBIDDEN,
        errorCode: ERROR_CODES.FORBIDDEN,
      });
    }

    await this.notificationRepository.delete(id, userId);
  }

  async createNotification(createNotificationDto: CreateNotificationDto) {
    const now = BigInt(Date.now());
    let sentCount = 0;

    if (createNotificationDto.targetAllUsers) {
      const allUsers = await this.prisma.user.findMany({
        select: { id: true },
      });
      const userIds = allUsers.map((user) => user.id);

      if (userIds.length > 0) {
        sentCount = await this.notificationRepository.createForUsers(userIds, {
          type: createNotificationDto.type,
          title: createNotificationDto.title,
          message: createNotificationDto.message,
          actionUrl: createNotificationDto.actionUrl,
          metadata: createNotificationDto.metadata || {},
          createdAt: now,
        });
      }
    } else if (
      createNotificationDto.targetUserIds &&
      createNotificationDto.targetUserIds.length > 0
    ) {
      const validUserIds = await this.prisma.user.findMany({
        where: {
          id: {
            in: createNotificationDto.targetUserIds,
          },
        },
        select: { id: true },
      });

      if (validUserIds.length === 0) {
        throw new BadRequestException({
          message: 'No valid users found',
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      const userIds = validUserIds.map((user) => user.id);
      sentCount = await this.notificationRepository.createForUsers(userIds, {
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        actionUrl: createNotificationDto.actionUrl,
        metadata: createNotificationDto.metadata || {},
        createdAt: now,
      });
    } else {
      throw new BadRequestException({
        message: 'Either targetAllUsers must be true or targetUserIds must be provided',
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    return {
      id: 'bulk',
      type: NOTIFICATION_TYPE_MAP[createNotificationDto.type] || 'system',
      title: createNotificationDto.title,
      message: createNotificationDto.message,
      createdAt: now.toString(),
      sentCount,
    };
  }

  /**
   * Create notification for a single user and emit via WebSocket
   */
  async createAndEmitNotification(data: {
    userId: number;
    type: string | number;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }) {
    const now = BigInt(Date.now());

    const typeNum = typeof data.type === 'string' ? parseInt(data.type, 10) : data.type;

    const notification = await this.notificationRepository.create({
      userId: data.userId,
      type: typeNum,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      metadata: data.metadata || {},
      createdAt: now,
    });

    // Emit via WebSocket for real-time delivery
    this.notificationGateway.sendNotificationToUser(data.userId, {
      id: notification.id.toString(),
      type: notification.type.toString(),
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      metadata: notification.metadata,
      createdAt: notification.createdAt.toString(),
    });

    return {
      id: notification.id.toString(),
      type: NOTIFICATION_TYPE_MAP[notification.type] || 'system',
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toString(),
      actionUrl: notification.actionUrl,
      metadata: notification.metadata,
    };
  }
}
