import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { INotificationRepository } from '@modules/notification/domain/repositories/notification.repository.interface';
import { Notification } from '@modules/notification/domain/entities/notification.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: number;
    type: number;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
    createdAt: bigint;
  }): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl || null,
        notificationMetadata: (data.metadata || {}) as Prisma.InputJsonValue,
        isRead: false,
        createdAt: data.createdAt,
      },
    });

    return this.toDomainNotification(notification);
  }

  async findById(id: number): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return null;
    }

    return this.toDomainNotification(notification);
  }

  async findByUserId(
    userId: number,
    filters?: {
      type?: number;
      isRead?: boolean;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: Notification[]; total: number }> {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      userId,
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: notifications.map((n) => this.toDomainNotification(n)),
      total,
    };
  }

  async countUnreadByUserId(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(id: number, userId: number): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async delete(id: number, userId: number): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }

  async createForUsers(
    userIds: number[],
    data: {
      type: number;
      title: string;
      message: string;
      actionUrl?: string;
      metadata?: Record<string, unknown>;
      createdAt: bigint;
    },
  ): Promise<number> {
    const now = BigInt(Date.now());
    const notifications = userIds.map((userId) => ({
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl || null,
      notificationMetadata: (data.metadata || {}) as Prisma.InputJsonValue,
      isRead: false,
      createdAt: data.createdAt || now,
    }));

    const result = await this.prisma.notification.createMany({
      data: notifications,
    });

    return result.count;
  }

  private toDomainNotification(notification: {
    id: number;
    userId: number;
    type: number;
    title: string;
    message: string;
    isRead: boolean;
    actionUrl: string | null;
    notificationMetadata: Prisma.JsonValue;
    createdAt: bigint;
  }): Notification {
    const metadata = notification.notificationMetadata as Record<string, unknown> | null;
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      actionUrl: notification.actionUrl || undefined,
      metadata: metadata || {},
      createdAt: notification.createdAt,
      updatedAt: notification.createdAt,
    };
  }
}
