import { Product, ProductImage } from '../entities/product.entity';

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

export interface IProductRepository {
  findById(id: number): Promise<Product | null>;
  findAll(options?: {
    query?: string;
    categoryId?: number;
    sellerId?: number;
    storeId?: number;
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
  update(id: number, data: Partial<Product>): Promise<Product>;
  delete(id: number): Promise<void>;
  count(options?: {
    query?: string;
    categoryId?: number;
    sellerId?: number;
    storeId?: number;
    status?: string;
    isActive?: boolean;
  }): Promise<number>;
  incrementViewCount(id: number): Promise<void>;
  updateStock(id: number, stock: number, reservedStock?: number): Promise<void>;
  findImages(productId: number): Promise<ProductImage[]>;
  addImage(productId: number, imageUrl: string, displayOrder?: number): Promise<ProductImage>;
  removeImage(imageId: number): Promise<void>;
  updateImageOrder(imageId: number, displayOrder: number): Promise<void>;
}

