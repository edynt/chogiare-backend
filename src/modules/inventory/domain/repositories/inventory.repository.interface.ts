import { StockInRecord } from '../entities/stock-in-record.entity';
import { StockMovement, StockMovementType } from '../entities/stock-movement.entity';

export const INVENTORY_REPOSITORY = Symbol('INVENTORY_REPOSITORY');

export interface IInventoryRepository {
  createStockInRecord(record: Partial<StockInRecord>): Promise<StockInRecord>;
  getStockInRecords(options?: {
    productId?: number;
    sellerId?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: StockInRecord[]; total: number }>;
  getStockInRecordById(id: number): Promise<StockInRecord | null>;
  createStockMovement(movement: Partial<StockMovement>): Promise<StockMovement>;
  getStockMovements(options?: {
    productId?: number;
    type?: StockMovementType;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: StockMovement[]; total: number }>;
  getLowStockProducts(
    sellerId: number,
  ): Promise<Array<{ id: number; title: string; stock: number; minStock: number }>>;
  updateProductStock(productId: number, quantity: number, reservedQuantity?: number): Promise<void>;
  getProductStock(productId: number): Promise<{
    stock: number;
    reservedStock: number;
    availableStock: number;
    minStock: number;
    maxStock: number | null;
  } | null>;
}
