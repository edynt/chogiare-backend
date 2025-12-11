import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { ICategoryRepository } from '@modules/category/domain/repositories/category.repository.interface';
import { Category } from '@modules/category/domain/entities/category.entity';
import { Category as PrismaCategory } from '@prisma/client';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    return category ? this.toDomain(category) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });
    return category ? this.toDomain(category) : null;
  }

  async findAll(options?: {
    parentId?: number | null;
    isActive?: boolean;
    includeChildren?: boolean;
  }): Promise<Category[]> {
    const where: {
      parentId?: number | null;
      isActive?: boolean;
    } = {};

    if (options?.parentId !== undefined) {
      where.parentId = options.parentId;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return categories.map((cat) => this.toDomain(cat));
  }

  async create(category: Partial<Category>): Promise<Category> {
    const created = await this.prisma.category.create({
      data: {
        name: category.name!,
        slug: category.slug!,
        description: category.description || null,
        image: category.image || null,
        parentId: category.parentId || null,
        productCount: category.productCount ?? 0,
        isActive: category.isActive ?? true,
        displayOrder: category.displayOrder ?? 0,
        metadata: (category.metadata as object) || {},
        createdAt: category.createdAt!,
        updatedAt: category.updatedAt!,
      },
    });
    return this.toDomain(created);
  }

  async update(id: number, category: Partial<Category>): Promise<Category> {
    const updateData: {
      name?: string;
      slug?: string;
      description?: string | null;
      image?: string | null;
      parentId?: number | null;
      displayOrder?: number;
      isActive?: boolean;
      metadata?: object;
      updatedAt: bigint;
    } = {
      updatedAt: category.updatedAt!,
    };

    if (category.name !== undefined) updateData.name = category.name;
    if (category.slug !== undefined) updateData.slug = category.slug;
    if (category.description !== undefined) updateData.description = category.description;
    if (category.image !== undefined) updateData.image = category.image;
    if (category.parentId !== undefined) updateData.parentId = category.parentId;
    if (category.displayOrder !== undefined) updateData.displayOrder = category.displayOrder;
    if (category.isActive !== undefined) updateData.isActive = category.isActive;
    if (category.metadata !== undefined) updateData.metadata = category.metadata as object;

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateData,
    });
    return this.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { id },
    });
    return count > 0;
  }

  async updateProductCount(id: number, increment: number): Promise<void> {
    await this.prisma.category.update({
      where: { id },
      data: {
        productCount: {
          increment,
        },
      },
    });
  }

  private toDomain(prismaCategory: PrismaCategory): Category {
    return {
      id: prismaCategory.id,
      name: prismaCategory.name,
      slug: prismaCategory.slug,
      description: prismaCategory.description,
      image: prismaCategory.image,
      parentId: prismaCategory.parentId,
      productCount: prismaCategory.productCount,
      isActive: prismaCategory.isActive,
      displayOrder: prismaCategory.displayOrder,
      metadata: prismaCategory.metadata as Record<string, unknown>,
      createdAt: prismaCategory.createdAt,
      updatedAt: prismaCategory.updatedAt,
    };
  }
}
