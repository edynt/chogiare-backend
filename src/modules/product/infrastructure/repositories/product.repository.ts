import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/repositories/product.repository.interface';
import { Product, ProductImage } from '../../domain/entities/product.entity';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return product ? this.toDomain(product) : null;
  }

  async findAll(options?: {
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
  }): Promise<Product[]> {
    const where: any = {};

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options?.sellerId) {
      where.sellerId = options.sellerId;
    }

    if (options?.storeId) {
      where.storeId = options.storeId;
    }

    if (options?.condition) {
      where.condition = options.condition;
    }

    if (options?.location) {
      where.location = { contains: options.location, mode: 'insensitive' };
    }

    if (options?.badges && options.badges.length > 0) {
      where.badges = { hasSome: options.badges };
    }

    if (options?.rating) {
      where.rating = { gte: options.rating };
    }

    if (options?.minRating) {
      where.rating = { gte: options.minRating };
    }

    if (options?.featured !== undefined) {
      where.isFeatured = options.featured;
    }

    if (options?.promoted !== undefined) {
      where.isPromoted = options.promoted;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.minPrice !== undefined || options?.maxPrice !== undefined) {
      where.price = {};
      if (options.minPrice !== undefined) {
        where.price.gte = options.minPrice;
      }
      if (options.maxPrice !== undefined) {
        where.price.lte = options.maxPrice;
      }
    }

    if (options?.query) {
      where.OR = [
        { title: { contains: options.query, mode: 'insensitive' } },
        { description: { contains: options.query, mode: 'insensitive' } },
        { tags: { hasSome: [options.query] } },
      ];
    }

    const orderBy: any = {};
    if (options?.sortBy) {
      orderBy[options.sortBy] = options.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const products = await this.prisma.product.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy,
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return products.map((p) => this.toDomain(p));
  }

  async create(
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'viewCount' | 'salesCount' | 'reservedStock' | 'availableStock'>,
  ): Promise<Product> {
    const now = BigInt(Date.now());
    const product = await this.prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice,
        categoryId: data.categoryId,
        sellerId: data.sellerId,
        storeId: data.storeId ?? null,
        condition: data.condition,
        tags: data.tags || [],
        location: data.location,
        stock: data.stock,
        minStock: data.minStock,
        maxStock: data.maxStock,
        reservedStock: 0,
        availableStock: data.stock,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        profit: data.profit,
        profitMargin: data.profitMargin,
        sku: data.sku,
        barcode: data.barcode,
        weight: data.weight,
        dimensions: data.dimensions,
        supplier: data.supplier,
        status: data.status,
        badges: data.badges || [],
        rating: 0,
        reviewCount: 0,
        viewCount: 0,
        salesCount: 0,
        isFeatured: data.isFeatured ?? false,
        isPromoted: data.isPromoted ?? false,
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      },
      include: {
        images: true,
      },
    });

    return this.toDomain(product);
  }

  async update(id: number, data: Partial<Product>): Promise<Product> {
    const now = BigInt(Date.now());
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice,
        categoryId: data.categoryId,
        condition: data.condition,
        tags: data.tags,
        location: data.location,
        stock: data.stock,
        minStock: data.minStock,
        maxStock: data.maxStock,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        profit: data.profit,
        profitMargin: data.profitMargin,
        sku: data.sku,
        barcode: data.barcode,
        weight: data.weight,
        dimensions: data.dimensions,
        supplier: data.supplier,
        status: data.status,
        badges: data.badges,
        isFeatured: data.isFeatured,
        isPromoted: data.isPromoted,
        isActive: data.isActive,
        updatedAt: now,
      },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return this.toDomain(product);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }

  async count(options?: {
    query?: string;
    categoryId?: number;
    sellerId?: number;
    storeId?: number;
    status?: string;
    isActive?: boolean;
  }): Promise<number> {
    const where: any = {};

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options?.sellerId) {
      where.sellerId = options.sellerId;
    }

    if (options?.storeId) {
      where.storeId = options.storeId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.query) {
      where.OR = [
        { title: { contains: options.query, mode: 'insensitive' } },
        { description: { contains: options.query, mode: 'insensitive' } },
        { tags: { hasSome: [options.query] } },
      ];
    }

    return this.prisma.product.count({ where });
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  async updateStock(
    id: number,
    stock: number,
    reservedStock?: number,
  ): Promise<void> {
    const availableStock = stock - (reservedStock || 0);
    await this.prisma.product.update({
      where: { id },
      data: {
        stock,
        availableStock,
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  async findImages(productId: number): Promise<ProductImage[]> {
    const images = await this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { displayOrder: 'asc' },
    });

    return images.map((img) => ({
      id: img.id,
      productId: img.productId,
      imageUrl: img.imageUrl,
      displayOrder: img.displayOrder,
      createdAt: img.createdAt,
    }));
  }

  async addImage(
    productId: number,
    imageUrl: string,
    displayOrder: number = 0,
  ): Promise<ProductImage> {
    const image = await this.prisma.productImage.create({
      data: {
        productId,
        imageUrl,
        displayOrder,
        createdAt: BigInt(Date.now()),
      },
    });

    return {
      id: image.id,
      productId: image.productId,
      imageUrl: image.imageUrl,
      displayOrder: image.displayOrder,
      createdAt: image.createdAt,
    };
  }

  async removeImage(imageId: number): Promise<void> {
    await this.prisma.productImage.delete({
      where: { id: imageId },
    });
  }

  async updateImageOrder(imageId: number, displayOrder: number): Promise<void> {
    await this.prisma.productImage.update({
      where: { id: imageId },
      data: { displayOrder },
    });
  }

  private toDomain(product: any): Product {
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price ? Number(product.price) : 0,
      originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
      categoryId: product.categoryId,
      sellerId: product.sellerId,
      storeId: product.storeId,
      condition: product.condition,
      tags: product.tags || [],
      location: product.location,
      stock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      reservedStock: product.reservedStock,
      availableStock: product.availableStock,
      costPrice: product.costPrice ? Number(product.costPrice) : undefined,
      sellingPrice: product.sellingPrice ? Number(product.sellingPrice) : undefined,
      profit: product.profit ? Number(product.profit) : undefined,
      profitMargin: product.profitMargin ? Number(product.profitMargin) : undefined,
      sku: product.sku,
      barcode: product.barcode,
      weight: product.weight ? Number(product.weight) : undefined,
      dimensions: product.dimensions,
      supplier: product.supplier,
      status: product.status,
      badges: product.badges || [],
      rating: product.rating ? Number(product.rating) : 0,
      reviewCount: product.reviewCount,
      viewCount: product.viewCount,
      salesCount: product.salesCount,
      isFeatured: product.isFeatured,
      isPromoted: product.isPromoted,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}

