import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  IStoreRepository,
  STORE_REPOSITORY,
} from '../../domain/repositories/store.repository.interface';
import { Store } from '../../domain/entities/store.entity';
import { CreateStoreDto } from '../dto/create-store.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { QueryStoreDto } from '../dto/query-store.dto';
import { PrismaService } from '@common/database/prisma.service';
import { LoggerService } from '@common/logger/logger.service';
import { MESSAGES } from '@common/constants/messages.constants';

@Injectable()
export class StoreService {
  constructor(
    @Inject(STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(userId: string, createStoreDto: CreateStoreDto): Promise<Store> {
    // Check if user already has a store
    const existingStore = await this.storeRepository.findByUserId(userId);
    if (existingStore) {
      this.logger.warn(
        `User ${userId} attempted to create second store`,
        'StoreService',
      );
      throw new ConflictException(MESSAGES.STORE.ALREADY_EXISTS);
    }

    // Generate slug if not provided
    const slug = createStoreDto.slug || this.generateSlug(createStoreDto.name);

    // Check if slug already exists
    const existingSlug = await this.storeRepository.findBySlug(slug);
    if (existingSlug) {
      throw new ConflictException(MESSAGES.STORE.SLUG_ALREADY_EXISTS);
    }

    const store = await this.storeRepository.create({
      ...createStoreDto,
      slug,
      userId,
      isVerified: false,
      isActive: createStoreDto.isActive ?? true,
    });

    this.logger.log(`Store created: ${store.id}`, 'StoreService', {
      storeId: store.id,
      userId,
      slug: store.slug,
    });

    return store;
  }

  async findAll(queryDto: QueryStoreDto): Promise<{
    data: Store[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.storeRepository.findAll({
        search: queryDto.search,
        isVerified: queryDto.isVerified,
        isActive: queryDto.isActive,
        city: queryDto.city,
        state: queryDto.state,
        country: queryDto.country,
        skip,
        take: limit,
      }),
      this.storeRepository.count({
        search: queryDto.search,
        isVerified: queryDto.isVerified,
        isActive: queryDto.isActive,
        city: queryDto.city,
        state: queryDto.state,
        country: queryDto.country,
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      throw new NotFoundException(MESSAGES.STORE.NOT_FOUND);
    }
    return store;
  }

  async findBySlug(slug: string): Promise<Store> {
    const store = await this.storeRepository.findBySlug(slug);
    if (!store) {
      throw new NotFoundException(MESSAGES.STORE.NOT_FOUND);
    }
    return store;
  }

  async findMyStore(userId: string): Promise<Store> {
    const store = await this.storeRepository.findByUserId(userId);
    if (!store) {
      throw new NotFoundException(MESSAGES.STORE.NOT_FOUND);
    }
    return store;
  }

  async update(
    id: string,
    userId: string,
    updateStoreDto: UpdateStoreDto,
    isAdmin: boolean = false,
  ): Promise<Store> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      throw new NotFoundException(MESSAGES.STORE.NOT_FOUND);
    }

    // Check permission
    if (!isAdmin && store.userId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to update store ${id} they don't own`,
        'StoreService',
      );
      throw new ForbiddenException(MESSAGES.STORE.NOT_OWNER);
    }

    // Only admin can update isVerified
    if (updateStoreDto.isVerified !== undefined && !isAdmin) {
      throw new ForbiddenException(MESSAGES.STORE.CANNOT_UPDATE_VERIFICATION);
    }

    // Check slug uniqueness if updating slug
    if (updateStoreDto.slug && updateStoreDto.slug !== store.slug) {
      const existingStore = await this.storeRepository.findBySlug(updateStoreDto.slug);
      if (existingStore) {
        throw new ConflictException(MESSAGES.STORE.SLUG_ALREADY_EXISTS);
      }
    }

    const updated = await this.storeRepository.update(id, updateStoreDto);

    this.logger.log(`Store updated: ${id}`, 'StoreService', {
      storeId: id,
      userId,
    });

    return updated;

    return this.storeRepository.update(id, updateStoreDto);
  }

  async remove(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      throw new NotFoundException(MESSAGES.STORE.NOT_FOUND);
    }

    // Check permission
    if (!isAdmin && store.userId !== userId) {
      throw new ForbiddenException(MESSAGES.STORE.NOT_OWNER);
    }

    // Check if store has active products
    const productCount = await this.prisma.product.count({
      where: {
        storeId: id,
        status: 'active',
      },
    });

    if (productCount > 0) {
      throw new ConflictException(MESSAGES.STORE.CANNOT_DELETE_WITH_PRODUCTS);
    }

    await this.storeRepository.delete(id);

    this.logger.log(`Store deleted: ${id}`, 'StoreService', {
      storeId: id,
      userId,
    });
  }
}

