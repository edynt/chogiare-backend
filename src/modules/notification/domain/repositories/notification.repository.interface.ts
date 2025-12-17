import { Notification } from '../entities/notification.entity';

export interface INotificationRepository {
  create(data: {
    userId: number;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
    createdAt: bigint;
  }): Promise<Notification>;

  findById(id: number): Promise<Notification | null>;

  findByUserId(
    userId: number,
    filters?: {
      type?: string;
      isRead?: boolean;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: Notification[]; total: number }>;

  countUnreadByUserId(userId: number): Promise<number>;

  markAsRead(id: number, userId: number): Promise<void>;

  markAllAsRead(userId: number): Promise<void>;

  delete(id: number, userId: number): Promise<void>;

  createForUsers(
    userIds: number[],
    data: {
      type: string;
      title: string;
      message: string;
      actionUrl?: string;
      metadata?: Record<string, unknown>;
      createdAt: bigint;
    },
  ): Promise<number>;
}

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

