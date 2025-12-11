export class StockInRecord {
  id: number;
  productId: number;
  quantity: number;
  costPrice: number | null;
  supplier: string | null;
  notes: string | null;
  createdBy: number;
  recordMetadata: Record<string, unknown>;
  createdAt: bigint;
}
