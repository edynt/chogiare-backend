import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { IProductRepository } from '@modules/product/domain/repositories/product.repository.interface';
import { Product, ProductWithRelations } from '@modules/product/domain/entities/product.entity';
import { PRODUCT_STATUS, PRODUCT_CONDITION } from '@common/constants/enum.constants';
import {
  Product as PrismaProduct,
  Prisma,
} from '@prisma/client';

// Type for product with eager-loaded relations
type PrismaProductWithRelations = PrismaProduct & {
  category: { id: number; name: string; slug: string } | null;
  images: Array<{ id: number; imageUrl: string; displayOrder: number }>;
};

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Standard include for product relations - reused across methods
  private readonly productInclude = {
    category: {
      select: { id: true, name: true, slug: true },
    },
    images: {
      orderBy: { displayOrder: 'asc' as const },
      select: { id: true, imageUrl: true, displayOrder: true },
    },
  };

  async findById(id: number): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    return product ? this.toDomain(product) : null;
  }

  // Optimized: Get product with all relations in a single query
  async findByIdWithRelations(id: number): Promise<ProductWithRelations | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: this.productInclude,
    });
    return product ? this.toDomainWithRelations(product as PrismaProductWithRelations) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { sku },
    });
    return product ? this.toDomain(product) : null;
  }

  async findAll(options?: {
    sellerId?: number;
    categoryId?: number;
    status?: number | string;
    isActive?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
    prioritizeBoosted?: boolean;
    isPromoted?: boolean;
    cursor?: number;
    minPrice?: number;
    maxPrice?: number;
    condition?: number;
    location?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    rating?: number;
  }): Promise<{ items: Product[]; total: number; nextCursor?: number | null }> {
    const where: Prisma.ProductWhereInput = {};

    if (options?.sellerId) {
      where.sellerId = options.sellerId;
    }

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options?.status !== undefined) {
      where.status = typeof options.status === 'string' ? parseInt(options.status, 10) : options.status;
    }

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    // Price range filter
    if (options?.minPrice !== undefined || options?.maxPrice !== undefined) {
      where.price = {};
      if (options?.minPrice !== undefined) {
        where.price.gte = options.minPrice;
      }
      if (options?.maxPrice !== undefined) {
        where.price.lte = options.maxPrice;
      }
    }

    // Condition filter
    if (options?.condition !== undefined) {
      where.condition = options.condition;
    }

    // Location filter
    if (options?.location) {
      where.location = { contains: options.location, mode: 'insensitive' };
    }

    // Rating filter
    if (options?.rating !== undefined && options.rating > 0) {
      where.rating = { gte: options.rating };
    }

    // Filter by promoted status - only show active boosted products
    if (options?.isPromoted !== undefined) {
      where.isPromoted = options.isPromoted;
      if (options.isPromoted) {
        // Only show products with active boost (boostEndAt > now)
        where.boostEndAt = { gt: BigInt(Date.now()) };
      }
    }

    const pageSize = options?.pageSize || 10;

    // Build orderBy from sortBy/sortOrder
    const sortField = options?.sortBy || 'createdAt';
    const sortDirection = options?.sortOrder || 'desc';
    const allowedSortFields = ['createdAt', 'price', 'rating', 'viewCount', 'salesCount', 'reviewCount'];
    const orderBy: Record<string, 'asc' | 'desc'> = allowedSortFields.includes(sortField)
      ? { [sortField]: sortDirection }
      : { createdAt: 'desc' };

    // Cursor-based pagination: use Prisma cursor API for efficient pagination
    if (options?.cursor) {
      const products = await this.prisma.product.findMany({
        where,
        take: pageSize,
        skip: 1, // skip the cursor item itself
        cursor: { id: options.cursor },
        orderBy,
      });
      const total = await this.prisma.product.count({ where });
      const items = products.map((p) => this.toDomain(p));
      const nextCursor = items.length === pageSize ? items[items.length - 1].id : null;
      return { items, total, nextCursor };
    }

    const page = options?.page || 1;
    const skip = (page - 1) * pageSize;

    // If prioritizeBoosted is true, use custom sorting with boost priority
    if (options?.prioritizeBoosted) {
      return this.findAllWithBoostPriority(where, skip, pageSize);
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    const items = products.map((p) => this.toDomain(p));
    const nextCursor = items.length === pageSize ? items[items.length - 1].id : null;

    return {
      items,
      total,
      nextCursor,
    };
  }

  /**
   * Find products with boost priority sorting:
   * 1. Active boosted products first (isPromoted=true AND boostEndAt > now)
   * 2. Among boosted: sort by durationDays DESC (higher package = higher priority)
   * 3. Non-boosted products: sort by createdAt DESC
   *
   * Note: This fetches a limited set from DB and sorts in memory.
   * For large datasets, consider using raw SQL for better performance.
   */
  private async findAllWithBoostPriority(
    where: Prisma.ProductWhereInput,
    skip: number,
    take: number,
  ): Promise<{ items: Product[]; total: number }> {
    const now = BigInt(Date.now());
    // Limit in-memory sorting to a reasonable amount for pagination
    const maxFetch = Math.max(skip + take, 200);

    // Get products with their active boost info, ordered by createdAt as base
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        take: maxFetch,
        orderBy: { createdAt: 'desc' },
        include: {
          boosts: {
            where: {
              isActive: true,
              endAt: { gt: now },
            },
            orderBy: { durationDays: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Sort: boosted products first by durationDays DESC, then non-boosted by createdAt DESC
    const sortedProducts = products.sort((a, b) => {
      const aBoost = a.boosts[0];
      const bBoost = b.boosts[0];
      const aIsBoosted = aBoost && a.isPromoted && a.boostEndAt && a.boostEndAt > now;
      const bIsBoosted = bBoost && b.isPromoted && b.boostEndAt && b.boostEndAt > now;

      // Boosted products come first
      if (aIsBoosted && !bIsBoosted) return -1;
      if (!aIsBoosted && bIsBoosted) return 1;

      // Both are boosted: sort by durationDays DESC
      if (aIsBoosted && bIsBoosted) {
        const aDays = aBoost?.durationDays || 0;
        const bDays = bBoost?.durationDays || 0;
        if (bDays !== aDays) return bDays - aDays;
        // Same durationDays: sort by boostEndAt DESC (more time remaining)
        return Number(b.boostEndAt) - Number(a.boostEndAt);
      }

      // Both non-boosted: sort by createdAt DESC
      return Number(b.createdAt) - Number(a.createdAt);
    });

    // Apply pagination after sorting
    const paginatedProducts = sortedProducts.slice(skip, skip + take);

    return {
      items: paginatedProducts.map((p) => this.toDomain(p)),
      total,
    };
  }

  async create(product: Partial<Product>): Promise<Product> {
    const created = await this.prisma.product.create({
      data: {
        sellerId: product.sellerId!,
        categoryId: product.categoryId!,
        title: product.title!,
        description: product.description || null,
        price: product.price!,
        originalPrice: product.originalPrice || null,
        condition: product.condition ?? PRODUCT_CONDITION.NEW,
        location: product.location || null,
        stock: product.stock ?? 0,
        minStock: product.minStock ?? 0,
        maxStock: product.maxStock || null,
        reservedStock: product.reservedStock ?? 0,
        availableStock: product.availableStock ?? product.stock ?? 0,
        costPrice: product.costPrice || null,
        sellingPrice: product.sellingPrice || null,
        profit: product.profit || null,
        profitMargin: product.profitMargin || null,
        sku: product.sku || null,
        barcode: product.barcode || null,
        status: product.status || PRODUCT_STATUS.DRAFT,
        rating: product.rating ?? 0,
        reviewCount: product.reviewCount ?? 0,
        viewCount: product.viewCount ?? 0,
        salesCount: product.salesCount ?? 0,
        isFeatured: product.isFeatured ?? false,
        isPromoted: product.isPromoted ?? false,
        tags: product.tags || [],
        badges: product.badges || [],
        warranty: product.warranty || null,
        returnPolicy: product.returnPolicy || null,
        inventoryInfo: (product.inventoryInfo as object) || {},
        metadata: (product.metadata as object) || {},
        createdAt: product.createdAt!,
        updatedAt: product.updatedAt!,
      },
    });
    return this.toDomain(created);
  }

  async update(id: number, product: Partial<Product>): Promise<Product> {
    const updateData: Prisma.ProductUpdateInput = {
      updatedAt: BigInt(Date.now()),
    };

    if (product.title !== undefined) updateData.title = product.title;
    if (product.description !== undefined) updateData.description = product.description;
    if (product.categoryId !== undefined) {
      updateData.category = {
        connect: { id: product.categoryId },
      };
    }
    if (product.price !== undefined) updateData.price = product.price;
    if (product.originalPrice !== undefined) updateData.originalPrice = product.originalPrice;
    if (product.condition !== undefined)
      updateData.condition = product.condition;
    if (product.location !== undefined) updateData.location = product.location;
    if (product.stock !== undefined) {
      updateData.stock = product.stock;
      updateData.availableStock = product.stock - (product.reservedStock ?? 0);
    }
    if (product.minStock !== undefined) updateData.minStock = product.minStock;
    if (product.maxStock !== undefined) updateData.maxStock = product.maxStock;
    if (product.costPrice !== undefined) updateData.costPrice = product.costPrice;
    if (product.sellingPrice !== undefined) updateData.sellingPrice = product.sellingPrice;
    if (product.sku !== undefined) updateData.sku = product.sku;
    if (product.barcode !== undefined) updateData.barcode = product.barcode;
    if (product.status !== undefined) updateData.status = product.status;
    if (product.isFeatured !== undefined) updateData.isFeatured = product.isFeatured;
    if (product.isPromoted !== undefined) updateData.isPromoted = product.isPromoted;
    if (product.tags !== undefined) updateData.tags = product.tags;
    if (product.badges !== undefined) updateData.badges = product.badges;
    if (product.warranty !== undefined) updateData.warranty = product.warranty;
    if (product.returnPolicy !== undefined) updateData.returnPolicy = product.returnPolicy;

    if (
      product.costPrice !== undefined &&
      product.sellingPrice !== undefined &&
      product.costPrice !== null &&
      product.sellingPrice !== null
    ) {
      const profit = product.sellingPrice - product.costPrice;
      const profitMargin = product.costPrice > 0 ? (profit / product.costPrice) * 100 : 0;
      updateData.profit = profit;
      updateData.profitMargin = profitMargin;
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });
    return this.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }

  async updateStock(id: number, quantity: number, reservedQuantity?: number): Promise<void> {
    const updateData: Prisma.ProductUpdateInput = {
      stock: quantity,
      updatedAt: BigInt(Date.now()),
    };

    if (reservedQuantity !== undefined) {
      updateData.reservedStock = reservedQuantity;
      updateData.availableStock = quantity - reservedQuantity;
    } else {
      const product = await this.prisma.product.findUnique({
        where: { id },
        select: { reservedStock: true },
      });
      if (product) {
        updateData.availableStock = quantity - product.reservedStock;
      }
    }

    await this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.product.count({
      where: { id },
    });
    return count > 0;
  }

  private toDomain(prismaProduct: PrismaProduct): Product {
    return {
      id: prismaProduct.id,
      sellerId: prismaProduct.sellerId,
      categoryId: prismaProduct.categoryId,
      title: prismaProduct.title,
      description: prismaProduct.description,
      price: Number(prismaProduct.price),
      originalPrice: prismaProduct.originalPrice ? Number(prismaProduct.originalPrice) : null,
      condition: prismaProduct.condition,
      location: prismaProduct.location,
      stock: prismaProduct.stock,
      minStock: prismaProduct.minStock,
      maxStock: prismaProduct.maxStock,
      reservedStock: prismaProduct.reservedStock,
      availableStock: prismaProduct.availableStock,
      costPrice: prismaProduct.costPrice ? Number(prismaProduct.costPrice) : null,
      sellingPrice: prismaProduct.sellingPrice ? Number(prismaProduct.sellingPrice) : null,
      profit: prismaProduct.profit ? Number(prismaProduct.profit) : null,
      profitMargin: prismaProduct.profitMargin ? Number(prismaProduct.profitMargin) : null,
      sku: prismaProduct.sku,
      barcode: prismaProduct.barcode,
      status: prismaProduct.status,
      rating: Number(prismaProduct.rating),
      reviewCount: prismaProduct.reviewCount,
      viewCount: prismaProduct.viewCount,
      salesCount: prismaProduct.salesCount,
      isFeatured: prismaProduct.isFeatured,
      isPromoted: prismaProduct.isPromoted,
      tags: prismaProduct.tags,
      badges: prismaProduct.badges,
      warranty: prismaProduct.warranty,
      returnPolicy: prismaProduct.returnPolicy,
      inventoryInfo: prismaProduct.inventoryInfo as Record<string, unknown>,
      metadata: prismaProduct.metadata as Record<string, unknown>,
      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
    };
  }

  private toDomainWithRelations(prismaProduct: PrismaProductWithRelations): ProductWithRelations {
    return {
      ...this.toDomain(prismaProduct),
      category: prismaProduct.category,
      images: prismaProduct.images,
    };
  }
}
