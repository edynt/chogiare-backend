import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/repositories/product.repository.interface';
import { Product, ProductStatus } from '../../domain/entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { QueryProductDto } from '../dto/query-product.dto';
import { UpdateStockDto } from '../dto/update-stock.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { PrismaService } from '@common/database/prisma.service';
import { LoggerService } from '@common/logger/logger.service';
import { MESSAGES } from '@common/constants/messages.constants';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async create(
    sellerId: number,
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    // Validate category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(MESSAGES.PRODUCT.CATEGORY_NOT_FOUND);
    }

    // Validate store if provided
    if (createProductDto.storeId) {
      const store = await this.prisma.store.findUnique({
        where: { id: createProductDto.storeId },
      });
      if (!store) {
        throw new NotFoundException(MESSAGES.PRODUCT.STORE_NOT_FOUND);
      }
      if (store.userId !== sellerId) {
        this.logger.warn(
          `User ${sellerId} attempted to create product in store ${createProductDto.storeId} they don't own`,
          'ProductService',
        );
        throw new ForbiddenException(MESSAGES.PRODUCT.NOT_STORE_OWNER);
      }
    } else {
      // Auto-assign store if user has one
      const store = await this.prisma.store.findFirst({
        where: { userId: sellerId },
      });
      if (store) {
        createProductDto.storeId = store.id;
      }
    }

    // Validate SKU uniqueness if provided
    if (createProductDto.sku) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { sku: createProductDto.sku },
      });
      if (existingProduct) {
        throw new ConflictException(MESSAGES.PRODUCT.SKU_ALREADY_EXISTS);
      }
    }

    // Calculate profit if costPrice is provided
    let profit: number | undefined;
    let profitMargin: number | undefined;
    if (createProductDto.costPrice) {
      profit = createProductDto.price - createProductDto.costPrice;
      profitMargin = (profit / createProductDto.costPrice) * 100;
    }

    const now = BigInt(Date.now());
    const stock = createProductDto.stock || 0;
    const minStock = createProductDto.minStock || 0;

    // Create product
    const product = await this.productRepository.create({
      ...createProductDto,
      sellerId,
      stock,
      minStock,
      tags: createProductDto.tags || [],
      status: createProductDto.status || ProductStatus.DRAFT,
      badges: createProductDto.badges || [],
      isFeatured: false,
      isPromoted: false,
      isActive: createProductDto.isActive ?? true,
      profit,
      profitMargin,
    });

    // Add images
    if (createProductDto.images && createProductDto.images.length > 0) {
      for (let i = 0; i < createProductDto.images.length; i++) {
        await this.productRepository.addImage(
          product.id,
          createProductDto.images[i],
          i,
        );
      }
    }

    // Check for low stock alert
    if (stock < minStock && minStock > 0) {
      await this.createStockAlert(
        product.id,
        'low_stock',
        `Stock (${stock}) is below minimum (${minStock})`,
      );
    }

    this.logger.log(`Product created: ${product.id}`, 'ProductService', {
      productId: product.id,
      sellerId,
      categoryId: createProductDto.categoryId,
    });

    return this.findOne(product.id);
  }

  async findAll(queryDto: QueryProductDto): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productRepository.findAll({
        query: queryDto.query,
        categoryId: queryDto.categoryId,
        sellerId: queryDto.sellerId,
        storeId: queryDto.storeId,
        minPrice: queryDto.minPrice,
        maxPrice: queryDto.maxPrice,
        condition: queryDto.condition,
        location: queryDto.location,
        badges: queryDto.badges,
        rating: queryDto.rating,
        minRating: queryDto.minRating,
        featured: queryDto.featured,
        promoted: queryDto.promoted,
        status: queryDto.status,
        isActive: queryDto.isActive,
        skip,
        take: limit,
        sortBy: queryDto.sortBy,
        sortOrder: queryDto.sortOrder || 'desc',
      }),
      this.productRepository.count({
        query: queryDto.query,
        categoryId: queryDto.categoryId,
        sellerId: queryDto.sellerId,
        storeId: queryDto.storeId,
        status: queryDto.status,
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

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(MESSAGES.PRODUCT.NOT_FOUND);
    }
    return product;
  }

  async incrementView(id: number): Promise<void> {
    await this.productRepository.incrementViewCount(id);
  }

  async update(
    id: number,
    sellerId: number,
    updateProductDto: UpdateProductDto,
    isAdmin: boolean = false,
  ): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(MESSAGES.PRODUCT.NOT_FOUND);
    }

    // Check permission
    if (!isAdmin && product.sellerId !== sellerId) {
      this.logger.warn(
        `User ${sellerId} attempted to update product ${id} they don't own`,
        'ProductService',
      );
      throw new ForbiddenException(MESSAGES.PRODUCT.NOT_OWNER);
    }

    // Validate category if updating
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(MESSAGES.PRODUCT.CATEGORY_NOT_FOUND);
      }
    }

    // Validate SKU uniqueness if updating
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { sku: updateProductDto.sku },
      });
      if (existingProduct) {
        throw new ConflictException(MESSAGES.PRODUCT.SKU_ALREADY_EXISTS);
      }
    }

    // Calculate profit if costPrice or price is updated
    let profit: number | undefined;
    let profitMargin: number | undefined;
    const updateData: Partial<Product> = { ...updateProductDto };
    if (updateProductDto.costPrice !== undefined || updateProductDto.price !== undefined) {
      const costPrice = updateProductDto.costPrice ?? product.costPrice;
      const price = updateProductDto.price ?? product.price;
      if (costPrice) {
        profit = price - costPrice;
        profitMargin = (profit / costPrice) * 100;
      }
      updateData.profit = profit;
      updateData.profitMargin = profitMargin;
    }

    // Update images if provided
    if (updateProductDto.images) {
      // Remove old images
      const oldImages = await this.productRepository.findImages(id);
      for (const image of oldImages) {
        await this.productRepository.removeImage(image.id);
      }
      // Add new images
      for (let i = 0; i < updateProductDto.images.length; i++) {
        await this.productRepository.addImage(id, updateProductDto.images[i], i);
      }
    }

    const updated = await this.productRepository.update(id, updateData);

    this.logger.log(`Product updated: ${id}`, 'ProductService', {
      productId: id,
      sellerId,
    });

    return updated;
  }

  async updateStock(
    id: number,
    sellerId: number,
    updateStockDto: UpdateStockDto,
  ): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(MESSAGES.PRODUCT.NOT_FOUND);
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException(MESSAGES.PRODUCT.NOT_OWNER);
    }

    const availableStock = updateStockDto.stock - product.reservedStock;
    if (availableStock < 0) {
      throw new BadRequestException(MESSAGES.PRODUCT.STOCK_BELOW_RESERVED);
    }

    await this.productRepository.updateStock(
      id,
      updateStockDto.stock,
      product.reservedStock,
    );

    // Check for low stock alert
    if (updateStockDto.stock < product.minStock && product.minStock > 0) {
      await this.createStockAlert(
        id,
        'low_stock',
        `Stock (${updateStockDto.stock}) is below minimum (${product.minStock})`,
      );
    }

    // Check for out of stock alert
    if (updateStockDto.stock === 0) {
      await this.createStockAlert(id, 'out_of_stock', 'Product is out of stock');
    }

    this.logger.log(`Product stock updated: ${id}`, 'ProductService', {
      productId: id,
      newStock: updateStockDto.stock,
    });

    return this.findOne(id);
  }

  async updateStatus(
    id: number,
    sellerId: number,
    updateStatusDto: UpdateStatusDto,
    isAdmin: boolean = false,
  ): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(MESSAGES.PRODUCT.NOT_FOUND);
    }

    // Check permission
    if (!isAdmin && product.sellerId !== sellerId) {
      throw new ForbiddenException(MESSAGES.PRODUCT.NOT_OWNER);
    }

    // Validate status transition
    if (!this.isValidStatusTransition(product.status, updateStatusDto.status)) {
      throw new BadRequestException(MESSAGES.PRODUCT.INVALID_STATUS_TRANSITION);
    }

    const updated = await this.productRepository.update(id, {
      status: updateStatusDto.status,
    });

    this.logger.log(`Product status updated: ${id}`, 'ProductService', {
      productId: id,
      oldStatus: product.status,
      newStatus: updateStatusDto.status,
    });

    return updated;
  }

  async remove(id: number, sellerId: number, isAdmin: boolean = false): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(MESSAGES.PRODUCT.NOT_FOUND);
    }

    if (!isAdmin && product.sellerId !== sellerId) {
      throw new ForbiddenException(MESSAGES.PRODUCT.NOT_OWNER);
    }

    // Check if product has pending orders
    const pendingOrders = await this.prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          status: {
            in: ['pending', 'confirmed', 'ready_for_pickup'],
          },
        },
      },
    });

    if (pendingOrders > 0) {
      throw new ConflictException(MESSAGES.PRODUCT.CANNOT_DELETE_WITH_ORDERS);
    }

    // Soft delete by setting status to archived
    await this.productRepository.update(id, { status: ProductStatus.ARCHIVED });

    this.logger.log(`Product archived: ${id}`, 'ProductService');
  }

  async getFeatured(limit: number = 10): Promise<Product[]> {
    return this.productRepository.findAll({
      featured: true,
      isActive: true,
      status: ProductStatus.ACTIVE,
      take: limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  async getMyProducts(
    sellerId: number,
    queryDto: QueryProductDto,
  ): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findAll({
      ...queryDto,
      sellerId,
    });
  }

  private isValidStatusTransition(
    currentStatus: ProductStatus,
    newStatus: ProductStatus,
  ): boolean {
    // Define valid transitions
    const validTransitions: Record<ProductStatus, ProductStatus[]> = {
      [ProductStatus.DRAFT]: [
        ProductStatus.ACTIVE,
        ProductStatus.ARCHIVED,
      ],
      [ProductStatus.ACTIVE]: [
        ProductStatus.SOLD,
        ProductStatus.ARCHIVED,
        ProductStatus.SUSPENDED,
      ],
      [ProductStatus.SOLD]: [ProductStatus.ARCHIVED],
      [ProductStatus.ARCHIVED]: [ProductStatus.ACTIVE],
      [ProductStatus.SUSPENDED]: [ProductStatus.ACTIVE, ProductStatus.ARCHIVED],
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  private async createStockAlert(
    productId: number,
    alertType: string,
    message: string,
  ): Promise<void> {
    await this.prisma.stockAlert.create({
      data: {
        productId,
        alertType,
        message,
        isRead: false,
        createdAt: BigInt(Date.now()),
      },
    });

    this.logger.warn(`Stock alert created: ${productId}`, 'ProductService', {
      productId,
      alertType,
    });
  }
}
