import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { isAdmin } from '@common/utils/admin.utils';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@modules/product/domain/repositories/product.repository.interface';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '@modules/category/domain/repositories/category.repository.interface';
import { QueryModerationProductDto } from '../dto/query-moderation-product.dto';

@Injectable()
export class AdminModerationProductService {
  private readonly cdnUrl: string;

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const s3Config = this.configService.get('s3');
    this.cdnUrl = s3Config?.cdnUrl || '';
  }

  private getImageUrl(imageUrl: string | null): string {
    if (!imageUrl) {
      return '';
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${imageUrl}`;
    }
    return imageUrl;
  }

  async getModerationProducts(adminId: number, queryDto: QueryModerationProductDto) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 50;

    const options: {
      sellerId?: number;
      categoryId?: number;
      status?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {
      page,
      pageSize,
    };

    // Handle category filter - can be ID (number as string) or name (string)
    if (queryDto.category) {
      const categoryId = parseInt(queryDto.category, 10);
      if (!isNaN(categoryId)) {
        options.categoryId = categoryId;
      }
      // Note: If category is a name string, we'd need to query by name, but for now we only support ID
    }

    if (queryDto.status) {
      // Map frontend status to backend status
      const statusMap: Record<string, string> = {
        pending: 'draft',
        approved: 'active',
        rejected: 'suspended',
        draft: 'draft',
      };
      options.status = statusMap[queryDto.status] || queryDto.status;
    }

    if (queryDto.search) {
      options.search = queryDto.search;
    }

    const result = await this.productRepository.findAll(options);

    // Format products for moderation response
    const formattedProducts = await Promise.all(
      result.items.map(async (product) => {
        const category = await this.categoryRepository.findById(product.categoryId);
        const images = await this.prisma.productImage.findMany({
          where: { productId: product.id },
          orderBy: { displayOrder: 'asc' },
        });

        // Get seller info
        const seller = await this.prisma.user.findUnique({
          where: { id: product.sellerId },
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        });

        // Map backend status to frontend status
        let moderationStatus: 'pending' | 'approved' | 'rejected' | 'draft';
        if (product.status === 'active') {
          moderationStatus = 'approved';
        } else if (product.status === 'suspended') {
          moderationStatus = 'rejected';
        } else if (product.status === 'draft') {
          moderationStatus = 'draft';
        } else {
          moderationStatus = 'pending';
        }

        return {
          id: product.id.toString(),
          title: product.title,
          seller: seller?.fullName || 'Unknown',
          sellerId: seller?.id.toString() || '',
          category: category?.name || '',
          price: Number(product.price),
          originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
          status: moderationStatus,
          priority: 'medium' as const, // Default priority
          submittedAt: new Date(Number(product.createdAt)).toISOString(),
          reviewedAt:
            product.status !== 'draft'
              ? new Date(Number(product.updatedAt)).toISOString()
              : undefined,
          reviewer: undefined, // Can be extended later
          images: images.map((img) => this.getImageUrl(img.imageUrl)),
          description: product.description || '',
          violations: [], // Can be extended later
          aiScore: 0, // Can be extended later
          manualReview: false, // Can be extended later
          tags: product.tags || [],
          stock: product.stock,
          views: product.viewCount,
          sales: product.salesCount,
        };
      }),
    );

    return {
      items: formattedProducts,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async approveProduct(adminId: number, productId: number) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.ADMIN.PRODUCT_NOT_FOUND,
        errorCode: ERROR_CODES.ADMIN_PRODUCT_NOT_FOUND,
      });
    }

    const updated = await this.productRepository.update(productId, {
      status: 'active',
      updatedAt: BigInt(Date.now()),
    });

    return updated;
  }

  async rejectProduct(adminId: number, productId: number, _reason?: string) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.ADMIN.PRODUCT_NOT_FOUND,
        errorCode: ERROR_CODES.ADMIN_PRODUCT_NOT_FOUND,
      });
    }

    // Use 'suspended' status as rejection (since 'rejected' is not in ProductStatus enum)
    const updated = await this.productRepository.update(productId, {
      status: 'suspended',
      updatedAt: BigInt(Date.now()),
    });

    return updated;
  }

  async bulkApproveProducts(adminId: number, productIds: number[]) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const results = await Promise.allSettled(
      productIds.map((id) => this.approveProduct(adminId, id)),
    );

    const success = results.filter((r) => r.status === 'fulfilled').length;

    return {
      count: success,
    };
  }

  async bulkRejectProducts(adminId: number, productIds: number[], reason?: string) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const results = await Promise.allSettled(
      productIds.map((id) => this.rejectProduct(adminId, id, reason)),
    );

    const success = results.filter((r) => r.status === 'fulfilled').length;

    return {
      count: success,
    };
  }
}
