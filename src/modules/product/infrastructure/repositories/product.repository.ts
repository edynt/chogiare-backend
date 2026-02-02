import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { IProductRepository } from '@modules/product/domain/repositories/product.repository.interface';
import { Product, ProductWithRelations } from '@modules/product/domain/entities/product.entity';
import {
  Product as PrismaProduct,
  Prisma,
  ProductCondition,
  ProductStatus,
  ProductBadge,
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
    status?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Product[]; total: number }> {
    const where: Prisma.ProductWhereInput = {};

    if (options?.sellerId) {
      where.sellerId = options.sellerId;
    }

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options?.status) {
      where.status = options.status as ProductStatus;
    }

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map((p) => this.toDomain(p)),
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
        condition: product.condition as ProductCondition,
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
        status: (product.status as ProductStatus) || ProductStatus.draft,
        rating: product.rating ?? 0,
        reviewCount: product.reviewCount ?? 0,
        viewCount: product.viewCount ?? 0,
        salesCount: product.salesCount ?? 0,
        isFeatured: product.isFeatured ?? false,
        isPromoted: product.isPromoted ?? false,
        tags: product.tags || [],
        badges: (product.badges as ProductBadge[]) || [],
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
      updateData.condition = product.condition as ProductCondition;
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
    if (product.status !== undefined) updateData.status = product.status as ProductStatus;
    if (product.isFeatured !== undefined) updateData.isFeatured = product.isFeatured;
    if (product.isPromoted !== undefined) updateData.isPromoted = product.isPromoted;
    if (product.tags !== undefined) updateData.tags = product.tags;
    if (product.badges !== undefined) updateData.badges = product.badges as ProductBadge[];
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
