export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SOLD = 'sold',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended',
}

export enum ProductBadge {
  NEW = 'NEW',
  FEATURED = 'FEATURED',
  PROMO = 'PROMO',
  HOT = 'HOT',
  SALE = 'SALE',
}

export class Product {
  id: number;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  categoryId: number;
  sellerId: number;
  storeId?: number;
  condition: ProductCondition;
  tags: string[];
  location?: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  reservedStock: number;
  availableStock: number;
  costPrice?: number;
  sellingPrice?: number;
  profit?: number;
  profitMargin?: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  supplier?: string;
  status: ProductStatus;
  badges: ProductBadge[];
  rating: number;
  reviewCount: number;
  viewCount: number;
  salesCount: number;
  isFeatured: boolean;
  isPromoted: boolean;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
}

export class ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  displayOrder: number;
  createdAt: bigint;
}

