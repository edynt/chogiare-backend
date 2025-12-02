import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
  IProductRepository,
  ProductFilters,
  CreateProductData,
  UpdateProductData,
} from '../../domain/repositories/product.repository.interface';
import { Product, ProductCondition, ProductStatus, ProductBadge } from '../../domain/entities/product.entity';

/**
 * Product Repository Implementation
 * Prisma-based implementation of product repository
 */
@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          include: {
            userInfo: true,
          },
        },
        store: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!product) return null;

    return this.toDomain(product);
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return products.map((p) => this.toDomain(p));
  }

  async findMany(filters: ProductFilters): Promise<{
    items: Product[];
    total: number;
  }> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ...where
    } = filters;

    const skip = (page - 1) * pageSize;

    // Build where clause
    const whereClause: any = {};

    if (where.categoryId) whereClause.categoryId = where.categoryId;
    if (where.sellerId) whereClause.sellerId = where.sellerId;
    if (where.storeId) whereClause.storeId = where.storeId;
    if (where.minPrice || where.maxPrice) {
      whereClause.price = {};
      if (where.minPrice) whereClause.price.gte = where.minPrice;
      if (where.maxPrice) whereClause.price.lte = where.maxPrice;
    }
    if (where.condition) whereClause.condition = where.condition;
    if (where.location) whereClause.location = { contains: where.location };
    if (where.badges && where.badges.length > 0) {
      whereClause.badges = { hasSome: where.badges };
    }
    if (where.rating !== undefined) whereClause.rating = { gte: where.rating };
    if (where.minRating !== undefined) whereClause.rating = { gte: where.minRating };
    if (where.featured !== undefined) whereClause.isFeatured = where.featured;
    if (where.promoted !== undefined) whereClause.isPromoted = where.promoted;
    if (where.status) whereClause.status = where.status;
    if (where.isActive !== undefined) whereClause.isActive = where.isActive;

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy,
        include: {
          category: true,
          images: {
            orderBy: { displayOrder: 'asc' },
            take: 1, // Only first image for list
          },
        },
      }),
      this.prisma.product.count({ where: whereClause }),
    ]);

    return {
      items: items.map((p) => this.toDomain(p)),
      total,
    };
  }

  async create(data: CreateProductData): Promise<Product> {
    const product = await this.prisma.product.create({
      data: {
        title: data.title,
        description: data.description || null,
        price: data.price,
        originalPrice: data.originalPrice || null,
        wholesalePrice: data.wholesalePrice || null,
        minOrderQuantity: data.minOrderQuantity || null,
        categoryId: data.categoryId,
        sellerId: data.sellerId,
        storeId: data.storeId || null,
        condition: data.condition as ProductCondition,
        tags: data.tags || [],
        location: data.location || null,
        stock: data.stock || 0,
        minStock: data.minStock || 0,
        maxStock: data.maxStock || null,
        reservedStock: 0,
        availableStock: data.stock || 0,
        costPrice: data.costPrice || null,
        sellingPrice: data.price,
        profit: data.costPrice && data.price
          ? data.price - data.costPrice
          : null,
        profitMargin: data.costPrice && data.price
          ? ((data.price - data.costPrice) / data.price) * 100
          : null,
        sku: data.sku || null,
        barcode: data.barcode || null,
        weight: data.weight || null,
        dimensions: data.dimensions || null,
        supplier: data.supplier || null,
        status: (data.status || 'draft') as ProductStatus,
        badges: (data.badges || []) as ProductBadge[],
        rating: 0,
        reviewCount: 0,
        viewCount: 0,
        salesCount: 0,
        isFeatured: false,
        isPromoted: false,
        isActive: true,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
      include: {
        category: true,
        images: true,
      },
    });

    return this.toDomain(product);
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    const updateData: any = {
      updatedAt: BigInt(Date.now()),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) {
      updateData.price = data.price;
      updateData.sellingPrice = data.price;
      // Recalculate profit if costPrice exists
      if (data.costPrice !== undefined) {
        updateData.profit = data.price - data.costPrice;
        updateData.profitMargin = ((data.price - data.costPrice) / data.price) * 100;
      }
    }
    if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice;
    if (data.wholesalePrice !== undefined) updateData.wholesalePrice = data.wholesalePrice;
    if (data.minOrderQuantity !== undefined) updateData.minOrderQuantity = data.minOrderQuantity;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.condition !== undefined) updateData.condition = data.condition as ProductCondition;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.stock !== undefined) {
      updateData.stock = data.stock;
      // Recalculate available stock
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (product) {
        updateData.availableStock = data.stock - product.reservedStock;
      }
    }
    if (data.minStock !== undefined) updateData.minStock = data.minStock;
    if (data.maxStock !== undefined) updateData.maxStock = data.maxStock;
    if (data.costPrice !== undefined) {
      updateData.costPrice = data.costPrice;
      // Recalculate profit
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (product && product.price) {
        updateData.profit = product.price - data.costPrice;
        updateData.profitMargin = ((product.price - data.costPrice) / product.price) * 100;
      }
    }
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.barcode !== undefined) updateData.barcode = data.barcode;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
    if (data.supplier !== undefined) updateData.supplier = data.supplier;
    if (data.status !== undefined) updateData.status = data.status as ProductStatus;
    if (data.badges !== undefined) updateData.badges = data.badges as ProductBadge[];
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isPromoted !== undefined) updateData.isPromoted = data.isPromoted;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: true,
      },
    });

    return this.toDomain(product);
  }

  async delete(id: string): Promise<void> {
    // Soft delete
    await this.prisma.product.update({
      where: { id },
      data: {
        isActive: false,
        status: 'archived' as ProductStatus,
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  async existsBySku(sku: string, excludeId?: string): Promise<boolean> {
    const where: any = { sku };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.product.count({ where });
    return count > 0;
  }

  async findBySeller(
    sellerId: string,
    filters?: ProductFilters,
  ): Promise<{ items: Product[]; total: number }> {
    return this.findMany({
      ...filters,
      sellerId,
    });
  }

  async findByCategory(
    categoryId: string,
    filters?: ProductFilters,
  ): Promise<{ items: Product[]; total: number }> {
    return this.findMany({
      ...filters,
      categoryId,
    });
  }

  async findByStore(
    storeId: string,
    filters?: ProductFilters,
  ): Promise<{ items: Product[]; total: number }> {
    return this.findMany({
      ...filters,
      storeId,
    });
  }

  async search(
    query: string,
    filters?: ProductFilters,
  ): Promise<{ items: Product[]; total: number }> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ...where
    } = filters || {};

    const skip = (page - 1) * pageSize;

    const whereClause: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ],
      ...where,
    };

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy,
        include: {
          category: true,
          images: {
            orderBy: { displayOrder: 'asc' },
            take: 1,
          },
        },
      }),
      this.prisma.product.count({ where: whereClause }),
    ]);

    return {
      items: items.map((p) => this.toDomain(p)),
      total,
    };
  }

  async findFeatured(limit: number = 10): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
        status: 'active',
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
    });

    return products.map((p) => this.toDomain(p));
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  /**
   * Convert Prisma model to Domain entity
   */
  private toDomain(prismaProduct: any): Product {
    return new Product(
      prismaProduct.id,
      prismaProduct.title,
      prismaProduct.description,
      Number(prismaProduct.price),
      prismaProduct.originalPrice ? Number(prismaProduct.originalPrice) : null,
      prismaProduct.wholesalePrice ? Number(prismaProduct.wholesalePrice) : null,
      prismaProduct.minOrderQuantity,
      prismaProduct.categoryId,
      prismaProduct.sellerId,
      prismaProduct.storeId,
      prismaProduct.condition as ProductCondition,
      prismaProduct.tags,
      prismaProduct.location,
      prismaProduct.stock,
      prismaProduct.minStock,
      prismaProduct.maxStock,
      prismaProduct.reservedStock,
      prismaProduct.availableStock,
      prismaProduct.costPrice ? Number(prismaProduct.costPrice) : null,
      prismaProduct.sellingPrice ? Number(prismaProduct.sellingPrice) : null,
      prismaProduct.profit ? Number(prismaProduct.profit) : null,
      prismaProduct.profitMargin ? Number(prismaProduct.profitMargin) : null,
      prismaProduct.sku,
      prismaProduct.barcode,
      prismaProduct.weight ? Number(prismaProduct.weight) : null,
      prismaProduct.dimensions,
      prismaProduct.supplier,
      prismaProduct.status as ProductStatus,
      prismaProduct.badges as ProductBadge[],
      Number(prismaProduct.rating),
      prismaProduct.reviewCount,
      prismaProduct.viewCount,
      prismaProduct.salesCount,
      prismaProduct.isFeatured,
      prismaProduct.isPromoted,
      prismaProduct.isActive,
      prismaProduct.createdAt,
      prismaProduct.updatedAt,
    );
  }
}


