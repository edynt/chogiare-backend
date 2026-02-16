import { Product } from '../entities/product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface IProductRepository {
  findById(id: number): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findAll(options?: {
    sellerId?: number;
    categoryId?: number;
    status?: number;
    isActive?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
    /** When true, prioritize boosted products (higher package duration first) */
    prioritizeBoosted?: boolean;
    /** Filter by promoted/boosted status */
    isPromoted?: boolean;
    /** Cursor for cursor-based pagination (product ID to start after) */
    cursor?: number;
  }): Promise<{ items: Product[]; total: number; nextCursor?: number | null }>;
  create(product: Partial<Product>): Promise<Product>;
  update(id: number, product: Partial<Product>): Promise<Product>;
  delete(id: number): Promise<void>;
  updateStock(id: number, quantity: number, reservedQuantity?: number): Promise<void>;
  exists(id: number): Promise<boolean>;
}
