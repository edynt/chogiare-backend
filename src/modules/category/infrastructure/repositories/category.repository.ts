import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    return category ? this.toDomain(category) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
      },
    });

    return category ? this.toDomain(category) : null;
  }

  async findAll(options?: {
    parentId?: number | null;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }): Promise<Category[]> {
    const where: any = {};

    if (options?.parentId !== undefined) {
      where.parentId = options.parentId;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const categories = await this.prisma.category.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      include: {
        parent: true,
        children: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return categories.map((c) => this.toDomain(c));
  }

  async create(
    data: Omit<Category, 'id' | 'createdAt' | 'productCount'>,
  ): Promise<Category> {
    const now = BigInt(Date.now());
    const category = await this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        parentId: data.parentId,
        isActive: data.isActive ?? true,
        productCount: 0,
        createdAt: now,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return this.toDomain(category);
  }

  async update(
    id: number,
    data: Partial<Category>,
  ): Promise<Category> {
    const category = await this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        parentId: data.parentId,
        isActive: data.isActive,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return this.toDomain(category);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }

  async count(options?: {
    parentId?: number | null;
    isActive?: boolean;
  }): Promise<number> {
    const where: any = {};

    if (options?.parentId !== undefined) {
      where.parentId = options.parentId;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    return this.prisma.category.count({ where });
  }

  private toDomain(category: any): Category {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      parentId: category.parentId,
      productCount: category.productCount,
      isActive: category.isActive,
      createdAt: category.createdAt,
      parent: category.parent ? this.toDomain(category.parent) : undefined,
      children: category.children
        ? category.children.map((c: any) => this.toDomain(c))
        : undefined,
    };
  }
}

