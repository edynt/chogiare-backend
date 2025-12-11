import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@modules/product/domain/repositories/product.repository.interface';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '@modules/category/domain/repositories/category.repository.interface';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { QueryProductDto } from '../dto/query-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(sellerId: number, createProductDto: CreateProductDto) {
    const category = await this.categoryRepository.findById(createProductDto.categoryId);
    if (!category) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.CATEGORY_NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_CATEGORY_NOT_FOUND,
      });
    }

    if (!category.isActive) {
      throw new BadRequestException({
        message: MESSAGES.CATEGORY.NOT_FOUND,
        errorCode: ERROR_CODES.CATEGORY_NOT_FOUND,
      });
    }

    if (createProductDto.sku) {
      const existingProduct = await this.productRepository.findBySku(createProductDto.sku);
      if (existingProduct) {
        throw new ConflictException({
          message: MESSAGES.PRODUCT.SKU_ALREADY_EXISTS,
          errorCode: ERROR_CODES.PRODUCT_SKU_ALREADY_EXISTS,
        });
      }
    }

    const profit =
      createProductDto.sellingPrice && createProductDto.costPrice
        ? createProductDto.sellingPrice - createProductDto.costPrice
        : null;
    const profitMargin =
      profit && createProductDto.costPrice && createProductDto.costPrice > 0
        ? (profit / createProductDto.costPrice) * 100
        : null;

    const now = BigInt(Date.now());
    const product = await this.productRepository.create({
      sellerId,
      storeId: createProductDto.storeId || null,
      categoryId: createProductDto.categoryId,
      title: createProductDto.title,
      description: createProductDto.description || null,
      price: createProductDto.price,
      originalPrice: createProductDto.originalPrice || null,
      condition: createProductDto.condition,
      location: createProductDto.location || null,
      stock: createProductDto.stock,
      minStock: createProductDto.minStock ?? 0,
      maxStock: createProductDto.maxStock || null,
      reservedStock: 0,
      availableStock: createProductDto.stock,
      costPrice: createProductDto.costPrice || null,
      sellingPrice: createProductDto.sellingPrice || createProductDto.price,
      profit,
      profitMargin,
      sku: createProductDto.sku || null,
      barcode: createProductDto.barcode || null,
      status: 'draft',
      rating: 0,
      reviewCount: 0,
      viewCount: 0,
      salesCount: 0,
      isFeatured: false,
      isPromoted: false,
      tags: createProductDto.tags || [],
      badges: createProductDto.badges || [],
      inventoryInfo: {},
      metadata: {},
      createdAt: now,
      updatedAt: now,
    });

    await this.categoryRepository.updateProductCount(createProductDto.categoryId, 1);

    return product;
  }

  async findAll(queryDto: QueryProductDto, userId?: number) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;

    const options: {
      sellerId?: number;
      categoryId?: number;
      status?: string;
      search?: string;
      page: number;
      pageSize: number;
    } = {
      page,
      pageSize,
    };

    if (queryDto.sellerId) {
      if (userId && userId !== queryDto.sellerId) {
        throw new UnauthorizedException({
          message: MESSAGES.PRODUCT.UNAUTHORIZED_ACCESS,
          errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED_ACCESS,
        });
      }
      options.sellerId = queryDto.sellerId;
    } else if (userId) {
      options.sellerId = userId;
    }

    if (queryDto.categoryId) {
      options.categoryId = queryDto.categoryId;
    }

    if (queryDto.status) {
      options.status = queryDto.status;
    } else if (!userId) {
      options.status = 'active';
    }

    if (queryDto.search) {
      options.search = queryDto.search;
    }

    const result = await this.productRepository.findAll(options);

    const products = await Promise.all(
      result.items.map(async (product) => {
        const category = await this.categoryRepository.findById(product.categoryId);
        const images = await this.prisma.productImage.findMany({
          where: { productId: product.id },
          orderBy: { displayOrder: 'asc' },
        });

        return {
          ...product,
          createdAt: product.createdAt.toString(),
          updatedAt: product.updatedAt.toString(),
          category: category
            ? {
                id: category.id,
                name: category.name,
                slug: category.slug,
              }
            : null,
          images: images.map((img) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            displayOrder: img.displayOrder,
          })),
        };
      }),
    );

    return {
      items: products,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async findOne(id: number, userId?: number) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    if (product.status !== 'active' && product.sellerId !== userId) {
      const userRoles = userId
        ? await this.prisma.userRole.findMany({
            where: { userId },
            include: { role: true },
          })
        : [];
      const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');

      if (!isAdmin) {
        throw new UnauthorizedException({
          message: MESSAGES.PRODUCT.UNAUTHORIZED_ACCESS,
          errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED_ACCESS,
        });
      }
    }

    const category = await this.categoryRepository.findById(product.categoryId);
    const images = await this.prisma.productImage.findMany({
      where: { productId: product.id },
      orderBy: { displayOrder: 'asc' },
    });

    return {
      ...product,
      createdAt: product.createdAt.toString(),
      updatedAt: product.updatedAt.toString(),
      category: category
        ? {
            id: category.id,
            name: category.name,
            slug: category.slug,
          }
        : null,
      images: images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        displayOrder: img.displayOrder,
      })),
    };
  }

  async update(id: number, updateProductDto: UpdateProductDto, userId: number) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');

    if (product.sellerId !== userId && !isAdmin) {
      throw new UnauthorizedException({
        message: MESSAGES.PRODUCT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED_ACCESS,
      });
    }

    if (updateProductDto.categoryId && updateProductDto.categoryId !== product.categoryId) {
      const category = await this.categoryRepository.findById(updateProductDto.categoryId);
      if (!category) {
        throw new NotFoundException({
          message: MESSAGES.PRODUCT.CATEGORY_NOT_FOUND,
          errorCode: ERROR_CODES.PRODUCT_CATEGORY_NOT_FOUND,
        });
      }

      await this.categoryRepository.updateProductCount(product.categoryId, -1);
      await this.categoryRepository.updateProductCount(updateProductDto.categoryId, 1);
    }

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findBySku(updateProductDto.sku);
      if (existingProduct) {
        throw new ConflictException({
          message: MESSAGES.PRODUCT.SKU_ALREADY_EXISTS,
          errorCode: ERROR_CODES.PRODUCT_SKU_ALREADY_EXISTS,
        });
      }
    }

    if (updateProductDto.status) {
      const validTransitions = this.getValidStatusTransitions(product.status);
      if (!validTransitions.includes(updateProductDto.status)) {
        throw new BadRequestException({
          message: MESSAGES.PRODUCT.INVALID_STATUS_TRANSITION,
          errorCode: ERROR_CODES.PRODUCT_INVALID_STATUS_TRANSITION,
        });
      }
    }

    const updateData: Partial<typeof product> = {
      ...updateProductDto,
      updatedAt: BigInt(Date.now()),
    };

    if (updateProductDto.sellingPrice !== undefined || updateProductDto.costPrice !== undefined) {
      const sellingPrice = updateProductDto.sellingPrice ?? product.sellingPrice ?? product.price;
      const costPrice = updateProductDto.costPrice ?? product.costPrice;
      if (costPrice !== null && costPrice !== undefined) {
        const profit = sellingPrice - costPrice;
        const profitMargin = costPrice > 0 ? (profit / costPrice) * 100 : 0;
        updateData.profit = profit;
        updateData.profitMargin = profitMargin;
      }
    }

    if (updateProductDto.stock !== undefined) {
      updateData.availableStock = updateProductDto.stock - product.reservedStock;
    }

    const updatedProduct = await this.productRepository.update(id, updateData);
    return updatedProduct;
  }

  async remove(id: number, userId: number) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');

    if (product.sellerId !== userId && !isAdmin) {
      throw new UnauthorizedException({
        message: MESSAGES.PRODUCT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED_ACCESS,
      });
    }

    await this.productRepository.delete(id);
    await this.categoryRepository.updateProductCount(product.categoryId, -1);
  }

  private getValidStatusTransitions(currentStatus: string): string[] {
    const transitions: Record<string, string[]> = {
      draft: ['active', 'archived'],
      active: ['sold', 'suspended', 'archived'],
      sold: ['archived'],
      suspended: ['active', 'archived'],
      archived: [],
    };
    return transitions[currentStatus] || [];
  }
}
