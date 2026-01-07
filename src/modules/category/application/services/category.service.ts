import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '@modules/category/domain/repositories/category.repository.interface';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { QueryCategoryDto } from '../dto/query-category.dto';

@Injectable()
export class CategoryService {
  private readonly cdnUrl: string;
  private readonly s3Bucket: string;
  private readonly s3Region: string;
  private readonly s3Endpoint: string;

  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const s3Config = this.configService.get('s3');
    this.cdnUrl = s3Config?.cdnUrl || '';
    this.s3Bucket = s3Config?.bucket || '';
    this.s3Region = s3Config?.region || '';
    this.s3Endpoint = s3Config?.endpoint || '';
  }

  private getImageUrl(imageUrl: string): string {
    if (!imageUrl) {
      return '';
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${imageUrl}`;
    }
    if (this.s3Endpoint) {
      return `${this.s3Endpoint}/${this.s3Bucket}/${imageUrl}`;
    }
    return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${imageUrl}`;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    let slug = createCategoryDto.slug;
    if (!slug) {
      slug = this.generateSlug(createCategoryDto.name);
    }

    const existingCategory = await this.categoryRepository.findBySlug(slug);
    if (existingCategory) {
      throw new ConflictException({
        message: MESSAGES.CATEGORY.SLUG_ALREADY_EXISTS,
        errorCode: ERROR_CODES.CATEGORY_SLUG_ALREADY_EXISTS,
      });
    }

    if (createCategoryDto.parentId) {
      const parentExists = await this.categoryRepository.exists(createCategoryDto.parentId);
      if (!parentExists) {
        throw new NotFoundException({
          message: MESSAGES.CATEGORY.PARENT_NOT_FOUND,
          errorCode: ERROR_CODES.CATEGORY_PARENT_NOT_FOUND,
        });
      }
    }

    const now = BigInt(Date.now());
    const category = await this.categoryRepository.create({
      name: createCategoryDto.name,
      slug,
      description: createCategoryDto.description || null,
      image: createCategoryDto.image || null,
      parentId: createCategoryDto.parentId || null,
      productCount: 0,
      isActive: createCategoryDto.isActive ?? true,
      displayOrder: createCategoryDto.displayOrder ?? 0,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    });

    return category;
  }

  async findAll(queryDto: QueryCategoryDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: {
      parentId?: number | null;
      isActive?: boolean;
    } = {};

    if (queryDto.parentId !== undefined) {
      where.parentId = queryDto.parentId;
    } else if (queryDto.parentId === null) {
      where.parentId = null;
    }

    if (queryDto.isActive !== undefined) {
      where.isActive = queryDto.isActive;
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          parent: true,
          children: queryDto.includeChildren
            ? {
                where:
                  queryDto.isActive !== undefined ? { isActive: queryDto.isActive } : undefined,
              }
            : false,
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      items: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        parentId: cat.parentId,
        productCount: cat.productCount,
        isActive: cat.isActive,
        displayOrder: cat.displayOrder,
        metadata: cat.metadata,
        createdAt: cat.createdAt.toString(),
        updatedAt: cat.updatedAt.toString(),
        parent: cat.parent
          ? {
              id: cat.parent.id,
              name: cat.parent.name,
              slug: cat.parent.slug,
            }
          : null,
        children: cat.children
          ? cat.children.map((child) => ({
              id: child.id,
              name: child.name,
              slug: child.slug,
              productCount: child.productCount,
              isActive: child.isActive,
            }))
          : undefined,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException({
        message: MESSAGES.CATEGORY.NOT_FOUND,
        errorCode: ERROR_CODES.CATEGORY_NOT_FOUND,
      });
    }

    const children = await this.prisma.category.findMany({
      where: { parentId: id },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    const parent = category.parentId
      ? await this.categoryRepository.findById(category.parentId)
      : null;

    return {
      ...category,
      createdAt: category.createdAt.toString(),
      updatedAt: category.updatedAt.toString(),
      parent: parent
        ? {
            id: parent.id,
            name: parent.name,
            slug: parent.slug,
          }
        : null,
      children: children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        productCount: child.productCount,
        isActive: child.isActive,
      })),
    };
  }

  async findBySlug(slug: string) {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException({
        message: MESSAGES.CATEGORY.NOT_FOUND,
        errorCode: ERROR_CODES.CATEGORY_NOT_FOUND,
      });
    }

    return this.findOne(category.id);
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException({
        message: MESSAGES.CATEGORY.NOT_FOUND,
        errorCode: ERROR_CODES.CATEGORY_NOT_FOUND,
      });
    }

    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException({
          message: MESSAGES.CATEGORY.CANNOT_BE_OWN_PARENT,
          errorCode: ERROR_CODES.CATEGORY_CANNOT_BE_OWN_PARENT,
        });
      }

      const isParentChanging = updateCategoryDto.parentId !== category.parentId;

      if (updateCategoryDto.parentId !== null && isParentChanging) {
        const parentExists = await this.categoryRepository.exists(updateCategoryDto.parentId);
        if (!parentExists) {
          throw new NotFoundException({
            message: MESSAGES.CATEGORY.PARENT_NOT_FOUND,
            errorCode: ERROR_CODES.CATEGORY_PARENT_NOT_FOUND,
          });
        }

        const isDescendant = await this.isDescendant(id, updateCategoryDto.parentId);
        if (isDescendant) {
          throw new BadRequestException({
            message: MESSAGES.CATEGORY.CANNOT_BE_DESCENDANT,
            errorCode: ERROR_CODES.CATEGORY_CANNOT_BE_DESCENDANT,
          });
        }
      }
    }

    const slug = updateCategoryDto.slug;
    if (slug && slug !== category.slug) {
      const existingCategory = await this.categoryRepository.findBySlug(slug);
      if (existingCategory) {
        throw new ConflictException({
          message: MESSAGES.CATEGORY.SLUG_ALREADY_EXISTS,
          errorCode: ERROR_CODES.CATEGORY_SLUG_ALREADY_EXISTS,
        });
      }
    }

    const updatedCategory = await this.categoryRepository.update(id, {
      ...updateCategoryDto,
      updatedAt: BigInt(Date.now()),
    });

    return updatedCategory;
  }

  async remove(id: number) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException({
        message: MESSAGES.CATEGORY.NOT_FOUND,
        errorCode: ERROR_CODES.CATEGORY_NOT_FOUND,
      });
    }

    const hasProducts = category.productCount > 0;
    if (hasProducts) {
      throw new ConflictException({
        message: MESSAGES.CATEGORY.HAS_PRODUCTS,
        errorCode: ERROR_CODES.CATEGORY_HAS_PRODUCTS,
      });
    }

    const hasChildren = await this.prisma.category.count({
      where: { parentId: id },
    });

    if (hasChildren > 0) {
      throw new ConflictException({
        message: MESSAGES.CATEGORY.HAS_CHILDREN,
        errorCode: ERROR_CODES.CATEGORY_HAS_CHILDREN,
      });
    }

    await this.categoryRepository.delete(id);
  }

  private async isDescendant(categoryId: number, potentialAncestorId: number): Promise<boolean> {
    let currentId: number | null = categoryId;
    const visited = new Set<number>();

    while (currentId !== null && !visited.has(currentId)) {
      visited.add(currentId);
      const category = await this.categoryRepository.findById(currentId);
      if (!category || !category.parentId) {
        return false;
      }
      if (category.parentId === potentialAncestorId) {
        return true;
      }
      currentId = category.parentId;
    }

    return false;
  }

  async getStats(id: number) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException({
        message: MESSAGES.CATEGORY.NOT_FOUND,
        errorCode: ERROR_CODES.CATEGORY_NOT_FOUND,
      });
    }

    const subcategoryCount = await this.prisma.category.count({
      where: { parentId: id },
    });

    return {
      productCount: category.productCount,
      subcategoryCount,
    };
  }

  async getProductsByCategory(
    categoryId: number,
    query: {
      page?: number;
      pageSize?: number;
      status?: string;
      search?: string;
    },
  ) {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException({
        message: MESSAGES.CATEGORY.NOT_FOUND,
        errorCode: ERROR_CODES.CATEGORY_NOT_FOUND,
      });
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      categoryId,
    };

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = 'active';
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const productsWithImages = await Promise.all(
      products.map(async (p) => {
        const images = await this.prisma.productImage.findMany({
          where: { productId: p.id },
          orderBy: { displayOrder: 'asc' },
        });

        return {
          id: p.id.toString(),
          title: p.title,
          description: p.description,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
          categoryId: p.categoryId.toString(),
          category: p.category
            ? {
                id: p.category.id,
                name: p.category.name,
                slug: p.category.slug,
              }
            : null,
          status: p.status,
          rating: Number(p.rating),
          reviewCount: p.reviewCount,
          viewCount: p.viewCount,
          stock: p.stock,
          images: images.map((img) => this.getImageUrl(img.imageUrl)),
          createdAt: p.createdAt.toString(),
          updatedAt: p.updatedAt.toString(),
        };
      }),
    );

    return {
      items: productsWithImages,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
