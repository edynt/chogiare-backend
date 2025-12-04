import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { QueryCategoryDto } from '../dto/query-category.dto';
import { PrismaService } from '@common/database/prisma.service';
import { LoggerService } from '@common/logger/logger.service';
import { MESSAGES } from '@common/constants/messages.constants';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check if slug already exists
    const existingCategory = await this.categoryRepository.findBySlug(
      createCategoryDto.slug,
    );
    if (existingCategory) {
      this.logger.warn(
        `Category creation with existing slug: ${createCategoryDto.slug}`,
        'CategoryService',
      );
      throw new ConflictException(MESSAGES.CATEGORY.SLUG_ALREADY_EXISTS);
    }

    // Check parent category if provided
    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findById(
        createCategoryDto.parentId,
      );
      if (!parent) {
        throw new NotFoundException(MESSAGES.CATEGORY.PARENT_NOT_FOUND);
      }
    }

    const now = BigInt(Date.now());
    const category = await this.categoryRepository.create({
      ...createCategoryDto,
      productCount: 0,
      createdAt: now,
    });

    this.logger.log(`Category created: ${category.id}`, 'CategoryService', {
      categoryId: category.id,
      slug: category.slug,
    });

    return category;
  }

  async findAll(queryDto: QueryCategoryDto): Promise<{
    data: Category[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.categoryRepository.findAll({
        parentId: queryDto.parentId,
        isActive: queryDto.isActive,
        skip,
        take: limit,
      }),
      this.categoryRepository.count({
        parentId: queryDto.parentId,
        isActive: queryDto.isActive,
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(MESSAGES.CATEGORY.NOT_FOUND);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException(MESSAGES.CATEGORY.NOT_FOUND);
    }
    return category;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(MESSAGES.CATEGORY.NOT_FOUND);
    }

    // Check slug uniqueness if updating slug
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingCategory = await this.categoryRepository.findBySlug(
        updateCategoryDto.slug,
      );
      if (existingCategory) {
        throw new ConflictException(MESSAGES.CATEGORY.SLUG_ALREADY_EXISTS);
      }
    }

    // Check parent category if provided
    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new ConflictException(MESSAGES.CATEGORY.CANNOT_BE_OWN_PARENT);
      }
      const parent = await this.categoryRepository.findById(
        updateCategoryDto.parentId,
      );
      if (!parent) {
        throw new NotFoundException(MESSAGES.CATEGORY.PARENT_NOT_FOUND);
      }
    }

    const updated = await this.categoryRepository.update(id, updateCategoryDto);

    this.logger.log(`Category updated: ${id}`, 'CategoryService');

    return updated;
  }

  async remove(id: number): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(MESSAGES.CATEGORY.NOT_FOUND);
    }

    // Check if category has products
    if (category.productCount > 0) {
      throw new ConflictException(MESSAGES.CATEGORY.CANNOT_DELETE_WITH_PRODUCTS);
    }

    // Check if category has children
    const children = await this.categoryRepository.findAll({ parentId: id });
    if (children.length > 0) {
      throw new ConflictException(MESSAGES.CATEGORY.CANNOT_DELETE_WITH_CHILDREN);
    }

    await this.categoryRepository.delete(id);

    this.logger.log(`Category deleted: ${id}`, 'CategoryService');
  }
}
