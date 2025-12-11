export class StockAlert {
  id: number;
  productId: number;
  userId: number;
  alertType: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt: bigint;
}
