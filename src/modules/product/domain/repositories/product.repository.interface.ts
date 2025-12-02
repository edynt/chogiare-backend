import { Product } from '../entities/product.entity';

/**
 * Product Repository Interface (Port)
 * Defines the contract for product data access
 */
export interface IProductRepository {
  /**
   * Find product by ID
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Find products by IDs
   */
  findByIds(ids: string[]): Promise<Product[]>;

  /**
   * Find products with filters
   */
  findMany(filters: ProductFilters): Promise<{
    items: Product[];
    total: number;
  }>;

  /**
   * Create new product
   */
  create(data: CreateProductData): Promise<Product>;

  /**
   * Update product
   */
  update(id: string, data: UpdateProductData): Promise<Product>;

  /**
   * Delete product (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if SKU exists
   */
  existsBySku(sku: string, excludeId?: string): Promise<boolean>;

  /**
   * Find products by seller
   */
  findBySeller(sellerId: string, filters?: ProductFilters): Promise<{
    items: Product[];
    total: number;
  }>;

  /**
   * Find products by category
   */
  findByCategory(categoryId: string, filters?: ProductFilters): Promise<{
    items: Product[];
    total: number;
  }>;

  /**
   * Find products by store
   */
  findByStore(storeId: string, filters?: ProductFilters): Promise<{
    items: Product[];
    total: number;
  }>;

  /**
   * Search products
   */
  search(query: string, filters?: ProductFilters): Promise<{
    items: Product[];
    total: number;
  }>;

  /**
   * Get featured products
   */
  findFeatured(limit?: number): Promise<Product[]>;

  /**
   * Increment view count
   */
  incrementViewCount(id: string): Promise<void>;
}

export interface ProductFilters {
  categoryId?: string;
  sellerId?: string;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  location?: string;
  badges?: string[];
  rating?: number;
  minRating?: number;
  featured?: boolean;
  promoted?: boolean;
  status?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductData {
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  wholesalePrice?: number;
  minOrderQuantity?: number;
  categoryId: string;
  sellerId: string;
  storeId?: string;
  condition: string;
  tags?: string[];
  location?: string;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  supplier?: string;
  status?: string;
  badges?: string[];
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  wholesalePrice?: number;
  minOrderQuantity?: number;
  categoryId?: string;
  condition?: string;
  tags?: string[];
  location?: string;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  supplier?: string;
  status?: string;
  badges?: string[];
  isFeatured?: boolean;
  isPromoted?: boolean;
  isActive?: boolean;
}

