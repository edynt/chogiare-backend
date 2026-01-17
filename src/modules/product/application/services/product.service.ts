import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { FILE_UPLOAD_PATHS } from '@common/constants/file.constants';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@modules/product/domain/repositories/product.repository.interface';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '@modules/category/domain/repositories/category.repository.interface';
import { UploadService } from '@modules/upload/application/services/upload.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { QueryProductDto } from '../dto/query-product.dto';

@Injectable()
export class ProductService {
  private readonly cdnUrl: string;
  private readonly s3Bucket: string;
  private readonly s3Region: string;
  private readonly s3Endpoint: string;

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly uploadService: UploadService,
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

  /**
   * Extract Cloudinary public_id from full URL
   * Example: https://res.cloudinary.com/dvweth7yl/image/upload/v1234567890/folder/image.jpg
   * Returns: folder/image
   */
  private extractCloudinaryPublicId(url: string): string | null {
    try {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  async create(
    sellerId: number,
    createProductDto: CreateProductDto,
    files?: Express.Multer.File[],
  ) {
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

    // STEP 1: Upload files to Cloudinary (BEFORE transaction)
    let uploadedImageUrls: string[] = [];

    if (files && files.length > 0) {
      try {
        // Validate files have buffer (required for memory storage)
        const validFiles = files.filter((file) => file && file.buffer && file.buffer.length > 0);
        if (validFiles.length === 0) {
          console.warn('No valid files with buffer found for upload');
        } else {
          const uploadResults = await this.uploadService.uploadMultipleFiles(
            validFiles,
            FILE_UPLOAD_PATHS.PRODUCTS,
            undefined,
            true,
          );
          uploadedImageUrls = uploadResults.map((result) => result.url);
        }
      } catch (error) {
        console.error('Failed to upload product images:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          filesCount: files.length,
          fileDetails: files.map((f) => ({
            name: f?.originalname,
            size: f?.size,
            mimetype: f?.mimetype,
            hasBuffer: !!(f?.buffer),
          })),
        });
        throw new InternalServerErrorException({
          message: 'Failed to upload product images',
          errorCode: 'UPLOAD_FAILED',
        });
      }
    }

    // Combine uploaded URLs with pre-uploaded URLs (backward compat)
    const allImageUrls = [...uploadedImageUrls, ...(createProductDto.images || [])];

    const profit =
      createProductDto.sellingPrice && createProductDto.costPrice
        ? createProductDto.sellingPrice - createProductDto.costPrice
        : null;
    const profitMargin =
      profit && createProductDto.costPrice && createProductDto.costPrice > 0
        ? (profit / createProductDto.costPrice) * 100
        : null;

    const now = BigInt(Date.now());

    // STEP 2: Create DB record in transaction
    return await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sellerId,
          storeId: createProductDto.storeId || null,
          categoryId: createProductDto.categoryId,
          title: createProductDto.title,
          description: createProductDto.description || null,
          price: createProductDto.price,
          originalPrice: createProductDto.originalPrice || null,
          condition: createProductDto.condition as any,
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
          status: (createProductDto.status || 'active') as any,
          rating: 0,
          reviewCount: 0,
          viewCount: 0,
          salesCount: 0,
          isFeatured: false,
          isPromoted: false,
          tags: createProductDto.tags || [],
          badges: (createProductDto.badges || []) as any,
          inventoryInfo: {},
          metadata: {},
          createdAt: now,
          updatedAt: now,
        },
      });

      // Save product images if provided
      if (allImageUrls.length > 0) {
        await tx.productImage.createMany({
          data: allImageUrls.map((url, index) => ({
            productId: product.id,
            imageUrl: url,
            displayOrder: index,
            createdAt: now,
          })),
        });
      }

      await this.categoryRepository.updateProductCount(createProductDto.categoryId, 1);

      return product;
    });
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

    // Only filter by sellerId if explicitly requested in query params
    if (queryDto.sellerId) {
      options.sellerId = queryDto.sellerId;
    }
    // Note: Don't auto-filter by userId here - this is a public products endpoint
    // For seller's own products, use /seller/products endpoint instead

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
          images: images.map((img) => this.getImageUrl(img.imageUrl)),
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
      images: images.map((img) => this.getImageUrl(img.imageUrl)),
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

    // Remove images from updateData to prevent it from being passed to Prisma update
    const { images: _images, ...updateDtoWithoutImages } = updateProductDto;
    const updateData: any = {
      ...updateDtoWithoutImages,
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

    // Handle image updates with transaction
    if (updateProductDto.images !== undefined) {
      return await this.prisma.$transaction(async (tx) => {
        // Get existing images for cleanup
        const existingImages = await tx.productImage.findMany({
          where: { productId: id },
        });

        // Delete existing images from database
        await tx.productImage.deleteMany({
          where: { productId: id },
        });

        // Insert new images if provided
        if (updateProductDto.images && updateProductDto.images.length > 0) {
          const now = BigInt(Date.now());
          await tx.productImage.createMany({
            data: updateProductDto.images.map((url, index) => ({
              productId: id,
              imageUrl: url,
              displayOrder: index,
              createdAt: now,
            })),
          });
        }

        // Update product
        const updatedProduct = await tx.product.update({
          where: { id },
          data: updateData,
        });

        // Delete old images from Cloudinary (do this after transaction succeeds)
        // Use Promise.allSettled to not block on deletion failures
        if (existingImages.length > 0) {
          const publicIds = existingImages
            .map((img) => this.extractCloudinaryPublicId(img.imageUrl))
            .filter((id): id is string => id !== null);

          if (publicIds.length > 0) {
            Promise.allSettled(
              publicIds.map((publicId) => this.uploadService.deleteFile(publicId)),
            ).catch((error) => {
              // Log error but don't fail the update
              console.error('Failed to delete some images from Cloudinary:', error);
            });
          }
        }

        return updatedProduct;
      });
    }

    // No image updates, just update product
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

  async searchProducts(query: string, queryDto: QueryProductDto, userId?: number) {
    return this.findAll({ ...queryDto, search: query }, userId);
  }

  async getFeaturedProducts(limit: number = 10) {
    const result = await this.productRepository.findAll({
      page: 1,
      pageSize: limit,
      status: 'active',
    });

    const featuredProducts = result.items.filter((p) => p.isFeatured);
    const products = await Promise.all(
      featuredProducts.map(async (product) => {
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
          images: images.map((img) => this.getImageUrl(img.imageUrl)),
        };
      }),
    );

    return products;
  }

  async getProductStats(id: number) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    const orders = await this.prisma.orderItem.findMany({
      where: { productId: id },
      include: {
        order: {
          select: {
            status: true,
          },
        },
      },
    });

    const sales = orders.filter((oi) => oi.order.status === 'completed').length;
    const views = product.viewCount;
    const rating = Number(product.rating);

    return {
      views,
      sales,
      rating,
    };
  }

  async incrementViews(id: number) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    await this.productRepository.update(id, {
      viewCount: product.viewCount + 1,
      updatedAt: BigInt(Date.now()),
    });
  }

  async updateStatus(id: number, status: string, userId: number) {
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

    const validTransitions = this.getValidStatusTransitions(product.status);
    if (!validTransitions.includes(status)) {
      throw new BadRequestException({
        message: MESSAGES.PRODUCT.INVALID_STATUS_TRANSITION,
        errorCode: ERROR_CODES.PRODUCT_INVALID_STATUS_TRANSITION,
      });
    }

    return await this.update(id, { status } as UpdateProductDto, userId);
  }

  async updateStock(id: number, stock: number, userId: number) {
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

    return await this.update(id, { stock } as UpdateProductDto, userId);
  }

  async bulkUpdate(
    updates: Array<{ id: number; data: Partial<UpdateProductDto> }>,
    userId: number,
  ) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    const isAdmin = userRoles.some((ur) => ur.role.name === 'admin');

    const results = await Promise.all(
      updates.map(async (update) => {
        const product = await this.productRepository.findById(update.id);
        if (!product) {
          return null;
        }

        if (product.sellerId !== userId && !isAdmin) {
          return null;
        }

        return await this.update(update.id, update.data, userId);
      }),
    );

    return results.filter((r) => r !== null);
  }

  async getSellerProducts(sellerId: number, queryDto: QueryProductDto) {
    return this.findAll({ ...queryDto, sellerId }, sellerId);
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
