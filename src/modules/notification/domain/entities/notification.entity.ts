export class Notification {
  id: number;
  userId: number;
  type: number;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}
