import { Product, ProductImage } from '../entities/product.entity';

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(options?: {
    query?: string;
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
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Product[]>;
  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'viewCount' | 'salesCount' | 'reservedStock' | 'availableStock'>): Promise<Product>;
  update(id: string, data: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
  count(options?: {
    query?: string;
    categoryId?: string;
    sellerId?: string;
    storeId?: string;
    status?: string;
    isActive?: boolean;
  }): Promise<number>;
  incrementViewCount(id: string): Promise<void>;
  updateStock(id: string, stock: number, reservedStock?: number): Promise<void>;
  findImages(productId: string): Promise<ProductImage[]>;
  addImage(productId: string, imageUrl: string, displayOrder?: number): Promise<ProductImage>;
  removeImage(imageId: number): Promise<void>;
  updateImageOrder(imageId: number, displayOrder: number): Promise<void>;
}

