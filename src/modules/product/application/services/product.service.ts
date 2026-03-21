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
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '@modules/payment/domain/repositories/payment.repository.interface';
import { UploadService } from '@modules/upload/application/services/upload.service';
import { PRODUCT_CONDITION, PRODUCT_STATUS, PRODUCT_BADGE, ORDER_STATUS, TRANSACTION_TYPE } from '@common/constants/enum.constants';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { QueryProductDto } from '../dto/query-product.dto';
import { BoostProductDto } from '../dto/boost-product.dto';

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
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
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
            hasBuffer: !!f?.buffer,
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
    // Cap profitMargin to Decimal(5,2) range: -999.99 to 999.99
    const rawMargin =
      profit && createProductDto.costPrice && createProductDto.costPrice > 0
        ? (profit / createProductDto.costPrice) * 100
        : null;
    const profitMargin = rawMargin !== null ? Math.max(-999.99, Math.min(999.99, rawMargin)) : null;

    const now = BigInt(Date.now());

    // STEP 2: Create DB record in transaction
    return await this.prisma.$transaction(async (tx) => {
      // Convert condition string to number
      const conditionNum = this.convertConditionToNumber(createProductDto.condition as string);
      // Convert status string to number
      const statusNum = createProductDto.status ? this.convertStatusToNumber(createProductDto.status as string) : PRODUCT_STATUS.ACTIVE;
      // Convert badges strings to numbers
      const badgesNum = createProductDto.badges ? this.convertBadgesToNumbers(createProductDto.badges as string[]) : [];

      const product = await tx.product.create({
        data: {
          sellerId,
          categoryId: createProductDto.categoryId,
          title: createProductDto.title,
          description: createProductDto.description || null,
          price: createProductDto.price,
          originalPrice: createProductDto.originalPrice || null,
          condition: conditionNum,
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
          status: statusNum,
          rating: 0,
          reviewCount: 0,
          viewCount: 0,
          salesCount: 0,
          isFeatured: false,
          isPromoted: false,
          tags: createProductDto.tags || [],
          badges: badgesNum,
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

      // Record initial price in price history
      await tx.priceHistory.create({
        data: {
          productId: product.id,
          oldPrice: createProductDto.price,
          newPrice: createProductDto.price,
          createdAt: now,
        },
      });

      return product;
    });
  }

  async findAll(queryDto: QueryProductDto, userId?: number) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;

    const options: {
      sellerId?: number;
      categoryId?: number;
      status?: number;
      search?: string;
      page: number;
      pageSize: number;
      prioritizeBoosted?: boolean;
      isPromoted?: boolean;
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
      const statusNum = typeof queryDto.status === 'string'
        ? this.convertStatusToNumber(queryDto.status)
        : queryDto.status;
      options.status = statusNum;
    } else if (!userId) {
      options.status = PRODUCT_STATUS.ACTIVE;
    }

    if (queryDto.search) {
      options.search = queryDto.search;
    }

    // Filter by promoted status if requested
    if (queryDto.isPromoted !== undefined) {
      options.isPromoted = queryDto.isPromoted;
    }

    // Prioritize boosted products for public (non-authenticated) requests
    // This shows boosted products first, sorted by package duration (higher duration = higher priority)
    if (!userId && !queryDto.cursor) {
      options.prioritizeBoosted = true;
    }

    // Cursor-based pagination support
    if (queryDto.cursor) {
      (options as Record<string, unknown>).cursor = queryDto.cursor;
    }

    const result = await this.productRepository.findAll(options);

    const products = await Promise.all(
      result.items.map(async (product) => {
        const [category, images, seller] = await Promise.all([
          this.categoryRepository.findById(product.categoryId),
          this.prisma.productImage.findMany({
            where: { productId: product.id },
            orderBy: { displayOrder: 'asc' },
          }),
          this.prisma.user.findUnique({
            where: { id: product.sellerId },
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              isVerified: true,
              sellerName: true,
              sellerSlug: true,
              sellerLogo: true,
              sellerIsVerified: true,
            },
          }),
        ]);

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
          seller: seller
            ? {
                id: seller.id,
                name: seller.fullName,
                avatar: seller.avatarUrl ? this.getImageUrl(seller.avatarUrl) : null,
                isVerified: seller.isVerified,
                sellerName: seller.sellerName,
                sellerSlug: seller.sellerSlug,
                sellerLogo: seller.sellerLogo ? this.getImageUrl(seller.sellerLogo) : null,
                sellerIsVerified: seller.sellerIsVerified,
              }
            : null,
        };
      }),
    );

    return {
      items: products,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
      nextCursor: result.nextCursor ?? null,
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

    if (product.status !== PRODUCT_STATUS.ACTIVE && product.sellerId !== userId) {
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

    // Fetch category, images, and seller in parallel
    const [category, images, seller] = await Promise.all([
      this.categoryRepository.findById(product.categoryId),
      this.prisma.productImage.findMany({
        where: { productId: product.id },
        orderBy: { displayOrder: 'asc' },
      }),
      this.prisma.user.findUnique({
        where: { id: product.sellerId },
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          isVerified: true,
        },
      }),
    ]);

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
      seller: seller
        ? {
            id: seller.id,
            name: seller.fullName,
            avatar: seller.avatarUrl,
            isVerified: seller.isVerified,
          }
        : null,
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

    // Only validate status transition if status is actually changing
    if (updateProductDto.status !== undefined) {
      const statusNum = typeof updateProductDto.status === 'string'
        ? this.convertStatusToNumber(updateProductDto.status)
        : updateProductDto.status;
      if (statusNum !== product.status) {
        const validTransitions = this.getValidStatusTransitions(product.status);
        if (!validTransitions.includes(statusNum)) {
          throw new BadRequestException({
            message: MESSAGES.PRODUCT.INVALID_STATUS_TRANSITION,
            errorCode: ERROR_CODES.PRODUCT_INVALID_STATUS_TRANSITION,
          });
        }
      }
      // Update the status in updateProductDto to use the converted number
      (updateProductDto as any).status = statusNum;
    }

    // Remove images from updateData to prevent it from being passed to Prisma update
    const { images: _unusedImages, ...updateDtoWithoutImages } = updateProductDto;
    const now = BigInt(Date.now());
    const updateData: Record<string, unknown> = {
      ...updateDtoWithoutImages,
      updatedAt: now,
    };

    if (updateProductDto.sellingPrice !== undefined || updateProductDto.costPrice !== undefined) {
      const sellingPrice = updateProductDto.sellingPrice ?? product.sellingPrice ?? product.price;
      const costPrice = updateProductDto.costPrice ?? product.costPrice;
      if (costPrice !== null && costPrice !== undefined) {
        const profit = sellingPrice - costPrice;
        // Cap profitMargin to Decimal(5,2) range: -999.99 to 999.99
        const rawMargin = costPrice > 0 ? (profit / costPrice) * 100 : 0;
        const profitMargin = Math.max(-999.99, Math.min(999.99, rawMargin));
        updateData.profit = profit;
        updateData.profitMargin = profitMargin;
      }
    }

    if (updateProductDto.stock !== undefined) {
      updateData.availableStock = updateProductDto.stock - product.reservedStock;
    }

    // Track price change if price is being updated
    const priceChanged = updateProductDto.price !== undefined &&
      Number(updateProductDto.price) !== Number(product.price);

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

        // Record price change in history
        if (priceChanged) {
          await tx.priceHistory.create({
            data: {
              productId: id,
              oldPrice: Number(product.price),
              newPrice: Number(updateProductDto.price),
              createdAt: now,
            },
          });
        }

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

    // No image updates — use transaction if price changed for atomicity
    if (priceChanged) {
      const now = BigInt(Date.now());
      return await this.prisma.$transaction(async (tx) => {
        const updatedProduct = await tx.product.update({
          where: { id },
          data: updateData,
        });
        await tx.priceHistory.create({
          data: {
            productId: id,
            oldPrice: Number(product.price),
            newPrice: Number(updateProductDto.price),
            createdAt: now,
          },
        });
        return updatedProduct;
      });
    }

    return await this.productRepository.update(id, updateData);
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

    // Get product images before deletion
    const productImages = await this.prisma.productImage.findMany({
      where: { productId: id },
    });

    // Delete product and related data from database
    await this.productRepository.delete(id);
    await this.categoryRepository.updateProductCount(product.categoryId, -1);

    // Delete images from Cloudinary (fire-and-forget, don't block deletion)
    if (productImages.length > 0) {
      const publicIds = productImages
        .map((img) => this.extractCloudinaryPublicId(img.imageUrl))
        .filter((publicId): publicId is string => publicId !== null);

      if (publicIds.length > 0) {
        Promise.allSettled(
          publicIds.map((publicId) => this.uploadService.deleteFile(publicId)),
        ).catch((error) => {
          console.error('Failed to delete product images from Cloudinary:', error);
        });
      }
    }
  }

  async searchProducts(query: string, queryDto: QueryProductDto, userId?: number) {
    return this.findAll({ ...queryDto, search: query }, userId);
  }

  async getFeaturedProducts(limit: number = 10) {
    // Use prioritizeBoosted to show boosted products first
    const result = await this.productRepository.findAll({
      page: 1,
      pageSize: limit * 2, // Fetch more to filter featured products
      status: PRODUCT_STATUS.ACTIVE,
      prioritizeBoosted: true,
    });

    const featuredProducts = result.items.filter((p) => p.isFeatured).slice(0, limit);
    const products = await Promise.all(
      featuredProducts.map(async (product) => {
        const [category, images, seller] = await Promise.all([
          this.categoryRepository.findById(product.categoryId),
          this.prisma.productImage.findMany({
            where: { productId: product.id },
            orderBy: { displayOrder: 'asc' },
          }),
          this.prisma.user.findUnique({
            where: { id: product.sellerId },
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              isVerified: true,
              sellerName: true,
              sellerSlug: true,
              sellerLogo: true,
              sellerIsVerified: true,
            },
          }),
        ]);

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
          seller: seller
            ? {
                id: seller.id,
                name: seller.fullName,
                avatar: seller.avatarUrl ? this.getImageUrl(seller.avatarUrl) : null,
                isVerified: seller.isVerified,
                sellerName: seller.sellerName,
                sellerSlug: seller.sellerSlug,
                sellerLogo: seller.sellerLogo ? this.getImageUrl(seller.sellerLogo) : null,
                sellerIsVerified: seller.sellerIsVerified,
              }
            : null,
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

    const sales = orders.filter((oi) => oi.order.status === ORDER_STATUS.COMPLETED).length;
    const views = product.viewCount;
    const rating = Number(product.rating);

    return {
      views,
      sales,
      rating,
    };
  }

  /**
   * Get price history for a product (last 90 days by default).
   * Auto-cleans stale entries: if price stable for 30+ days, keeps only latest record.
   */
  async getPriceHistory(productId: number, days = 90) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    const nowMs = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // Fetch all history for this product (for cleanup evaluation)
    const allHistory = await this.prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });

    // Auto-cleanup: if latest price change is older than 30 days, price is stable
    // Delete all old entries, keep only the most recent one
    if (allHistory.length > 1) {
      const latestEntry = allHistory[allHistory.length - 1];
      const latestTimestamp = Number(latestEntry.createdAt);

      if (nowMs - latestTimestamp > thirtyDaysMs) {
        // Price stable for 30+ days — delete all except the latest
        const idsToDelete = allHistory.slice(0, -1).map((h) => h.id);
        await this.prisma.priceHistory.deleteMany({
          where: { id: { in: idsToDelete } },
        });

        // Return only the latest entry
        return {
          productId,
          currentPrice: Number(product.price),
          history: [{
            id: latestEntry.id,
            oldPrice: Number(latestEntry.oldPrice),
            newPrice: Number(latestEntry.newPrice),
            createdAt: latestEntry.createdAt.toString(),
          }],
        };
      }
    }

    // Filter by requested days range
    const sinceTimestamp = BigInt(nowMs - days * 24 * 60 * 60 * 1000);
    const filtered = allHistory.filter((h) => h.createdAt >= sinceTimestamp);

    return {
      productId,
      currentPrice: Number(product.price),
      history: filtered.map((h) => ({
        id: h.id,
        oldPrice: Number(h.oldPrice),
        newPrice: Number(h.newPrice),
        createdAt: h.createdAt.toString(),
      })),
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
    const statusNum = typeof status === 'string' ? this.convertStatusToNumber(status) : status;
    if (!validTransitions.includes(statusNum)) {
      throw new BadRequestException({
        message: MESSAGES.PRODUCT.INVALID_STATUS_TRANSITION,
        errorCode: ERROR_CODES.PRODUCT_INVALID_STATUS_TRANSITION,
      });
    }

    return await this.update(id, { status: statusNum as any } as UpdateProductDto, userId);
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

  private getValidStatusTransitions(currentStatus: number): number[] {
    // Allow free transitions between draft, active, and out_of_stock
    const allStatuses = [PRODUCT_STATUS.DRAFT, PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.OUT_OF_STOCK];
    return allStatuses.filter((s) => s !== currentStatus);
  }

  private convertConditionToNumber(condition: string): number {
    const conditionMap: Record<string, number> = {
      new: PRODUCT_CONDITION.NEW,
      like_new: PRODUCT_CONDITION.LIKE_NEW,
      good: PRODUCT_CONDITION.GOOD,
      fair: PRODUCT_CONDITION.FAIR,
      poor: PRODUCT_CONDITION.POOR,
    };
    return conditionMap[condition?.toLowerCase()] ?? PRODUCT_CONDITION.NEW;
  }

  private convertStatusToNumber(status: string): number {
    const statusMap: Record<string, number> = {
      draft: PRODUCT_STATUS.DRAFT,
      active: PRODUCT_STATUS.ACTIVE,
      out_of_stock: PRODUCT_STATUS.OUT_OF_STOCK,
    };
    return statusMap[status?.toLowerCase()] ?? PRODUCT_STATUS.ACTIVE;
  }

  private convertBadgesToNumbers(badges: string[]): number[] {
    const badgeMap: Record<string, number> = {
      NEW: PRODUCT_BADGE.NEW,
      FEATURED: PRODUCT_BADGE.FEATURED,
      PROMO: PRODUCT_BADGE.PROMO,
      HOT: PRODUCT_BADGE.HOT,
      SALE: PRODUCT_BADGE.SALE,
    };
    return badges.map((badge) => badgeMap[badge?.toUpperCase()] ?? 0).filter((b) => b > 0);
  }

  async getBoostPackages() {
    const packages = await this.prisma.servicePackage.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    return packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      displayName: pkg.displayName,
      description: pkg.description,
      durationDays: pkg.durationDays,
      price: Number(pkg.price),
      features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features,
    }));
  }

  async boostProduct(productId: number, boostDto: BoostProductDto, userId: number) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    if (product.sellerId !== userId) {
      throw new UnauthorizedException({
        message: MESSAGES.PRODUCT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED_ACCESS,
      });
    }

    const boostPackage = await this.prisma.servicePackage.findUnique({
      where: { id: boostDto.packageId, isActive: true },
    });

    if (!boostPackage) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.BOOST_PACKAGE_NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_BOOST_PACKAGE_NOT_FOUND,
      });
    }

    const packagePrice = Number(boostPackage.price);
    const now = BigInt(Date.now());
    const additionalMs = boostPackage.durationDays * 24 * 60 * 60 * 1000;

    // Use transaction with atomic balance check and deduction
    const result = await this.prisma.$transaction(async (tx) => {
      // Get user balance with row-level lock (SELECT FOR UPDATE)
      const userBalance = await tx.userBalance.findUnique({
        where: { userId },
      });

      if (!userBalance || Number(userBalance.balance) < packagePrice) {
        throw new BadRequestException({
          message: MESSAGES.PAYMENT.INSUFFICIENT_BALANCE,
          errorCode: ERROR_CODES.PAYMENT_INSUFFICIENT_BALANCE,
        });
      }

      // Check for existing active boost to calculate cumulative end time
      const existingBoost = await tx.productBoost.findFirst({
        where: {
          productId,
          isActive: true,
          endAt: { gt: now }, // Only consider non-expired boosts
        },
        orderBy: { endAt: 'desc' },
      });

      // Calculate new end time: if active boost exists, add to its endAt; otherwise start from now
      const baseTime = existingBoost ? Number(existingBoost.endAt) : Date.now();
      const boostEndAt = BigInt(baseTime + additionalMs);

      // Deduct balance atomically
      const updatedBalance = await tx.userBalance.update({
        where: { userId },
        data: {
          balance: { decrement: packagePrice },
          updatedAt: now,
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: TRANSACTION_TYPE.BOOST,
          amount: packagePrice,
          currency: 'VND',
          status: 'completed',
          paymentMethod: null,
          reference: `BOOST-${productId}-${Date.now()}`,
          description: `Đẩy sản phẩm: ${product.title} - Gói ${boostPackage.displayName}`,
          orderId: null,
          transactionMetadata: { productId, packageId: boostDto.packageId },
          createdAt: now,
          updatedAt: now,
        },
      });

      // Deactivate any existing active boost for this product
      await tx.productBoost.updateMany({
        where: { productId, isActive: true },
        data: { isActive: false },
      });

      // Create boost record with cumulative end time
      const boost = await tx.productBoost.create({
        data: {
          productId,
          packageId: boostDto.packageId,
          pricePaid: packagePrice,
          durationDays: boostPackage.durationDays,
          startAt: now,
          endAt: boostEndAt,
          isActive: true,
          createdAt: now,
        },
      });

      // Update product
      await tx.product.update({
        where: { id: productId },
        data: {
          isPromoted: true,
          boostEndAt,
          updatedAt: now,
        },
      });

      return { boost, newBalance: Number(updatedBalance.balance) };
    });

    return {
      boost: {
        id: result.boost.id,
        productId: result.boost.productId,
        packageId: result.boost.packageId,
        pricePaid: Number(result.boost.pricePaid),
        durationDays: result.boost.durationDays,
        startAt: result.boost.startAt.toString(),
        endAt: result.boost.endAt.toString(),
      },
      balance: {
        current: result.newBalance,
      },
    };
  }

  async getProductBoostStatus(productId: number, userId: number) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    if (product.sellerId !== userId) {
      throw new UnauthorizedException({
        message: MESSAGES.PRODUCT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED_ACCESS,
      });
    }

    const activeBoost = await this.prisma.productBoost.findFirst({
      where: {
        productId,
        isActive: true,
        endAt: { gt: BigInt(Date.now()) },
      },
      include: { package: true },
      orderBy: { endAt: 'desc' },
    });

    if (!activeBoost) {
      return {
        isPromoted: false,
        boost: null,
      };
    }

    return {
      isPromoted: true,
      boost: {
        id: activeBoost.id,
        packageName: activeBoost.package.displayName,
        startAt: activeBoost.startAt.toString(),
        endAt: activeBoost.endAt.toString(),
        remainingDays: Math.ceil((Number(activeBoost.endAt) - Date.now()) / (24 * 60 * 60 * 1000)),
      },
    };
  }

  /**
   * Remove boost from a product (deactivate it)
   */
  async removeProductBoost(productId: number, userId: number) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    if (product.sellerId !== userId) {
      throw new UnauthorizedException({
        message: MESSAGES.PRODUCT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED_ACCESS,
      });
    }

    const now = BigInt(Date.now());

    // Deactivate all boosts for this product
    await this.prisma.$transaction(async (tx) => {
      await tx.productBoost.updateMany({
        where: { productId, isActive: true },
        data: { isActive: false },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          isPromoted: false,
          boostEndAt: null,
          updatedAt: now,
        },
      });
    });

    return { removed: true };
  }

  /**
   * Get all boosted products for a seller
   * Returns products from product_boosts table with active boosts
   */
  async getSellerBoostedProducts(sellerId: number, options: { page: number; pageSize: number }) {
    const { page, pageSize } = options;
    const skip = (page - 1) * pageSize;
    const now = BigInt(Date.now());

    // Get boosted products for this seller
    const [boosts, total] = await Promise.all([
      this.prisma.productBoost.findMany({
        where: {
          product: { sellerId },
          isActive: true,
          endAt: { gt: now },
        },
        include: {
          package: true,
          product: {
            include: {
              images: {
                orderBy: { displayOrder: 'asc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { endAt: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.productBoost.count({
        where: {
          product: { sellerId },
          isActive: true,
          endAt: { gt: now },
        },
      }),
    ]);

    const items = boosts.map((boost) => ({
      id: boost.id.toString(),
      productId: boost.productId,
      product: {
        id: boost.product.id.toString(),
        title: boost.product.title,
        name: boost.product.title,
        price: Number(boost.product.price),
        images: boost.product.images.map((img) => this.getImageUrl(img.imageUrl)),
        viewCount: boost.product.viewCount,
      },
      packageId: boost.packageId,
      packageName: boost.package.displayName,
      pricePaid: Number(boost.pricePaid),
      durationDays: boost.durationDays,
      startAt: boost.startAt.toString(),
      endAt: boost.endAt.toString(),
      isActive: boost.isActive,
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
