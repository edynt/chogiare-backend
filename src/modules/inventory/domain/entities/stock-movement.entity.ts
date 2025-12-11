export enum StockMovementType {
  STOCK_IN = 'stock_in',
  STOCK_OUT = 'stock_out',
  STOCK_ADJUSTMENT = 'stock_adjustment',
  STOCK_RESERVED = 'stock_reserved',
  STOCK_RELEASED = 'stock_released',
}

export class StockMovement {
  id: number;
  productId: number;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  referenceId: number | null;
  referenceType: string | null;
  createdBy: number;
  metadata: Record<string, unknown>;
  createdAt: bigint;
}
