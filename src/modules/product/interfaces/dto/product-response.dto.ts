import { Product } from '../../domain/entities/product.entity';

export class ProductResponseDto {
  id: string;
  title: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  wholesalePrice: number | null;
  minOrderQuantity: number | null;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  sellerId: string;
  seller?: {
    id: string;
    email: string;
    userInfo?: {
      fullName: string | null;
      avatarUrl: string | null;
    };
  };
  storeId: string | null;
  store?: {
    id: string;
    name: string;
    logo: string | null;
  };
  condition: string;
  tags: string[];
  location: string | null;
  stock: number;
  minStock: number;
  maxStock: number | null;
  reservedStock: number;
  availableStock: number;
  costPrice: number | null;
  sellingPrice: number | null;
  profit: number | null;
  profitMargin: number | null;
  sku: string | null;
  barcode: string | null;
  weight: number | null;
  dimensions: string | null;
  supplier: string | null;
  status: string;
  badges: string[];
  rating: number;
  reviewCount: number;
  viewCount: number;
  salesCount: number;
  isFeatured: boolean;
  isPromoted: boolean;
  isActive: boolean;
  images?: Array<{
    id: number;
    imageUrl: string;
    displayOrder: number;
  }>;
  createdAt: string;
  updatedAt: string;

  static fromDomain(product: Product, includeRelations?: any): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.title = product.title;
    dto.description = product.description;
    dto.price = product.price;
    dto.originalPrice = product.originalPrice;
    dto.wholesalePrice = product.wholesalePrice;
    dto.minOrderQuantity = product.minOrderQuantity;
    dto.categoryId = product.categoryId;
    dto.sellerId = product.sellerId;
    dto.storeId = product.storeId;
    dto.condition = product.condition;
    dto.tags = product.tags;
    dto.location = product.location;
    dto.stock = product.stock;
    dto.minStock = product.minStock;
    dto.maxStock = product.maxStock;
    dto.reservedStock = product.reservedStock;
    dto.availableStock = product.availableStock;
    dto.costPrice = product.costPrice;
    dto.sellingPrice = product.sellingPrice;
    dto.profit = product.profit;
    dto.profitMargin = product.profitMargin;
    dto.sku = product.sku;
    dto.barcode = product.barcode;
    dto.weight = product.weight;
    dto.dimensions = product.dimensions;
    dto.supplier = product.supplier;
    dto.status = product.status;
    dto.badges = product.badges;
    dto.rating = product.rating;
    dto.reviewCount = product.reviewCount;
    dto.viewCount = product.viewCount;
    dto.salesCount = product.salesCount;
    dto.isFeatured = product.isFeatured;
    dto.isPromoted = product.isPromoted;
    dto.isActive = product.isActive;
    dto.createdAt = product.createdAt.toString();
    dto.updatedAt = product.updatedAt.toString();

    // Include relations if provided
    if (includeRelations) {
      if (includeRelations.category) {
        dto.category = {
          id: includeRelations.category.id,
          name: includeRelations.category.name,
          slug: includeRelations.category.slug,
        };
      }
      if (includeRelations.seller) {
        dto.seller = {
          id: includeRelations.seller.id,
          email: includeRelations.seller.email,
          userInfo: includeRelations.seller.userInfo
            ? {
                fullName: includeRelations.seller.userInfo.fullName,
                avatarUrl: includeRelations.seller.userInfo.avatarUrl,
              }
            : undefined,
        };
      }
      if (includeRelations.store) {
        dto.store = {
          id: includeRelations.store.id,
          name: includeRelations.store.name,
          logo: includeRelations.store.logo,
        };
      }
      if (includeRelations.images) {
        dto.images = includeRelations.images.map((img: any) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          displayOrder: img.displayOrder,
        }));
      }
    }

    return dto;
  }
}


