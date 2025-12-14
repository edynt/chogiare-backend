import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { Prisma } from '@prisma/client';
import { IStoreRepository } from '@modules/store/domain/repositories/store.repository.interface';
import { Store } from '@modules/store/domain/entities/store.entity';

@Injectable()
export class StoreRepository implements IStoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Store | null> {
    const store = await this.prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return null;
    }

    return this.toDomainStore(store);
  }

  async findByUserId(userId: number): Promise<Store | null> {
    const store = await this.prisma.store.findFirst({
      where: { userId },
    });

    if (!store) {
      return null;
    }

    return this.toDomainStore(store);
  }

  async findBySlug(slug: string): Promise<Store | null> {
    const store = await this.prisma.store.findUnique({
      where: { slug },
    });

    if (!store) {
      return null;
    }

    return this.toDomainStore(store);
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    search?: string;
    isVerified?: boolean;
    isActive?: boolean;
  }): Promise<{ stores: Store[]; total: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isVerified !== undefined) {
      where.isVerified = query.isVerified;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      stores: stores.map((store) => this.toDomainStore(store)),
      total,
    };
  }

  async create(data: {
    userId: number;
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    logo?: string;
    banner?: string;
    contactInfo?: Record<string, unknown>;
    addressInfo?: Record<string, unknown>;
    businessInfo?: Record<string, unknown>;
    businessHours?: Record<string, unknown>;
    policies?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<Store> {
    const now = BigInt(Date.now());
    const store = await this.prisma.store.create({
      data: {
        userId: data.userId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        logo: data.logo,
        banner: data.banner,
        contactInfo: (data.contactInfo || {}) as Prisma.InputJsonValue,
        addressInfo: (data.addressInfo || {}) as Prisma.InputJsonValue,
        businessInfo: (data.businessInfo || {}) as Prisma.InputJsonValue,
        businessHours: (data.businessHours || {}) as Prisma.InputJsonValue,
        policies: (data.policies || {}) as Prisma.InputJsonValue,
        metadata: (data.metadata || {}) as Prisma.InputJsonValue,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.toDomainStore(store);
  }

  async update(id: number, data: Partial<Store>): Promise<Store> {
    const updateData: Record<string, unknown> = {
      updatedAt: BigInt(Date.now()),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.banner !== undefined) updateData.banner = data.banner;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.contactInfo !== undefined) updateData.contactInfo = data.contactInfo;
    if (data.addressInfo !== undefined) updateData.addressInfo = data.addressInfo;
    if (data.businessInfo !== undefined) updateData.businessInfo = data.businessInfo;
    if (data.businessHours !== undefined) updateData.businessHours = data.businessHours;
    if (data.policies !== undefined) updateData.policies = data.policies;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const store = await this.prisma.store.update({
      where: { id },
      data: updateData,
    });

    return this.toDomainStore(store);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.store.delete({
      where: { id },
    });
  }

  async updateStats(id: number, stats: {
    productCount?: number;
    reviewCount?: number;
    followerCount?: number;
    rating?: number;
  }): Promise<void> {
    const updateData: Record<string, unknown> = {
      updatedAt: BigInt(Date.now()),
    };

    if (stats.productCount !== undefined) updateData.productCount = stats.productCount;
    if (stats.reviewCount !== undefined) updateData.reviewCount = stats.reviewCount;
    if (stats.followerCount !== undefined) updateData.followerCount = stats.followerCount;
    if (stats.rating !== undefined) updateData.rating = stats.rating;

    await this.prisma.store.update({
      where: { id },
      data: updateData,
    });
  }

  private toDomainStore(store: {
    id: number;
    userId: number;
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    logo: string | null;
    banner: string | null;
    rating: unknown;
    reviewCount: number;
    productCount: number;
    followerCount: number;
    isVerified: boolean;
    isActive: boolean;
    contactInfo: unknown;
    addressInfo: unknown;
    businessInfo: unknown;
    businessHours: unknown;
    policies: unknown;
    metadata: unknown;
    createdAt: bigint;
    updatedAt: bigint;
  }): Store {
    return {
      id: store.id,
      userId: store.userId,
      name: store.name,
      slug: store.slug,
      description: store.description || undefined,
      shortDescription: store.shortDescription || undefined,
      logo: store.logo || undefined,
      banner: store.banner || undefined,
      rating: Number(store.rating),
      reviewCount: store.reviewCount,
      productCount: store.productCount,
      followerCount: store.followerCount,
      isVerified: store.isVerified,
      isActive: store.isActive,
      contactInfo: store.contactInfo as Record<string, unknown>,
      addressInfo: store.addressInfo as Record<string, unknown>,
      businessInfo: store.businessInfo as Record<string, unknown>,
      businessHours: store.businessHours as Record<string, unknown>,
      policies: store.policies as Record<string, unknown>,
      metadata: store.metadata as Record<string, unknown>,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    };
  }
}


