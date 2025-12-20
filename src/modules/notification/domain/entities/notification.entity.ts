export class Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}
