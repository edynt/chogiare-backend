/**
 * Product Domain Entity
 * Represents the core business object for products
 */
export class Product {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly price: number, // Retail price
    public readonly originalPrice: number | null,
    public readonly wholesalePrice: number | null,
    public readonly minOrderQuantity: number | null, // MOQ
    public readonly categoryId: string,
    public readonly sellerId: string,
    public readonly storeId: string | null,
    public readonly condition: ProductCondition,
    public readonly tags: string[],
    public readonly location: string | null,
    public readonly stock: number,
    public readonly minStock: number,
    public readonly maxStock: number | null,
    public readonly reservedStock: number,
    public readonly availableStock: number,
    public readonly costPrice: number | null,
    public readonly sellingPrice: number | null,
    public readonly profit: number | null,
    public readonly profitMargin: number | null,
    public readonly sku: string | null,
    public readonly barcode: string | null,
    public readonly weight: number | null,
    public readonly dimensions: string | null,
    public readonly supplier: string | null,
    public readonly status: ProductStatus,
    public readonly badges: ProductBadge[],
    public readonly rating: number,
    public readonly reviewCount: number,
    public readonly viewCount: number,
    public readonly salesCount: number,
    public readonly isFeatured: boolean,
    public readonly isPromoted: boolean,
    public readonly isActive: boolean,
    public readonly createdAt: bigint,
    public readonly updatedAt: bigint,
  ) {}

  /**
   * Check if product is available for purchase
   */
  isAvailable(): boolean {
    return (
      this.isActive &&
      this.status === ProductStatus.ACTIVE &&
      this.availableStock > 0
    );
  }

  /**
   * Check if product has sufficient stock
   */
  hasStock(quantity: number): boolean {
    return this.availableStock >= quantity;
  }

  /**
   * Check if quantity meets MOQ for wholesale
   */
  meetsMOQ(quantity: number): boolean {
    if (!this.minOrderQuantity) return true;
    return quantity >= this.minOrderQuantity;
  }

  /**
   * Calculate price based on quantity (wholesale pricing)
   */
  calculatePrice(quantity: number, customerGroup?: CustomerGroupType): number {
    // If wholesale price exists and meets MOQ, use wholesale price
    if (
      this.wholesalePrice &&
      this.meetsMOQ(quantity) &&
      customerGroup === CustomerGroupType.WHOLESALE
    ) {
      return Number(this.wholesalePrice);
    }

    // Otherwise use retail price
    return Number(this.price);
  }

  /**
   * Reserve stock
   */
  reserveStock(quantity: number): Product {
    if (!this.hasStock(quantity)) {
      throw new Error('Insufficient stock');
    }

    return new Product(
      this.id,
      this.title,
      this.description,
      this.price,
      this.originalPrice,
      this.wholesalePrice,
      this.minOrderQuantity,
      this.categoryId,
      this.sellerId,
      this.storeId,
      this.condition,
      this.tags,
      this.location,
      this.stock,
      this.minStock,
      this.maxStock,
      this.reservedStock + quantity,
      this.availableStock - quantity,
      this.costPrice,
      this.sellingPrice,
      this.profit,
      this.profitMargin,
      this.sku,
      this.barcode,
      this.weight,
      this.dimensions,
      this.supplier,
      this.status,
      this.badges,
      this.rating,
      this.reviewCount,
      this.viewCount,
      this.salesCount,
      this.isFeatured,
      this.isPromoted,
      this.isActive,
      this.createdAt,
      BigInt(Date.now()),
    );
  }

  /**
   * Release reserved stock
   */
  releaseStock(quantity: number): Product {
    return new Product(
      this.id,
      this.title,
      this.description,
      this.price,
      this.originalPrice,
      this.wholesalePrice,
      this.minOrderQuantity,
      this.categoryId,
      this.sellerId,
      this.storeId,
      this.condition,
      this.tags,
      this.location,
      this.stock,
      this.minStock,
      this.maxStock,
      Math.max(0, this.reservedStock - quantity),
      this.availableStock + quantity,
      this.costPrice,
      this.sellingPrice,
      this.profit,
      this.profitMargin,
      this.sku,
      this.barcode,
      this.weight,
      this.dimensions,
      this.supplier,
      this.status,
      this.badges,
      this.rating,
      this.reviewCount,
      this.viewCount,
      this.salesCount,
      this.isFeatured,
      this.isPromoted,
      this.isActive,
      this.createdAt,
      BigInt(Date.now()),
    );
  }

  /**
   * Deduct stock (when order completed)
   */
  deductStock(quantity: number): Product {
    return new Product(
      this.id,
      this.title,
      this.description,
      this.price,
      this.originalPrice,
      this.wholesalePrice,
      this.minOrderQuantity,
      this.categoryId,
      this.sellerId,
      this.storeId,
      this.condition,
      this.tags,
      this.location,
      Math.max(0, this.stock - quantity),
      this.minStock,
      this.maxStock,
      Math.max(0, this.reservedStock - quantity),
      Math.max(0, this.availableStock - quantity),
      this.costPrice,
      this.sellingPrice,
      this.profit,
      this.profitMargin,
      this.sku,
      this.barcode,
      this.weight,
      this.dimensions,
      this.supplier,
      this.status,
      this.badges,
      this.rating,
      this.reviewCount,
      this.viewCount,
      this.salesCount + quantity,
      this.isFeatured,
      this.isPromoted,
      this.isActive,
      this.createdAt,
      BigInt(Date.now()),
    );
  }
}

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

export enum CustomerGroupType {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale',
  VIP = 'vip',
}


