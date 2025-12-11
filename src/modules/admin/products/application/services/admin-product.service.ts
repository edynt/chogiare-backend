import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { isAdmin } from '@common/utils/admin.utils';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@modules/product/domain/repositories/product.repository.interface';
import { QueryAdminProductDto } from '../dto/query-admin-product.dto';

@Injectable()
export class AdminProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getProducts(adminId: number, queryDto: QueryAdminProductDto) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const options: {
      sellerId?: number;
      categoryId?: number;
      status?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {
      page: queryDto.page,
      pageSize: queryDto.pageSize,
    };

    if (queryDto.sellerId) {
      options.sellerId = queryDto.sellerId;
    }

    if (queryDto.categoryId) {
      options.categoryId = queryDto.categoryId;
    }

    if (queryDto.status) {
      options.status = queryDto.status;
    }

    if (queryDto.search) {
      options.search = queryDto.search;
    }

    const result = await this.productRepository.findAll(options);

    return {
      message: MESSAGES.ADMIN.PRODUCTS_RETRIEVED,
      data: result,
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

    if (product.status !== 'draft') {
      throw new ForbiddenException({
        message: MESSAGES.PRODUCT.INVALID_STATUS_TRANSITION,
        errorCode: ERROR_CODES.PRODUCT_INVALID_STATUS_TRANSITION,
      });
    }

    const updated = await this.productRepository.update(productId, {
      status: 'active',
      updatedAt: BigInt(Date.now()),
    });

    return {
      message: MESSAGES.ADMIN.PRODUCT_APPROVED,
      data: updated,
    };
  }

  async suspendProduct(adminId: number, productId: number) {
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
      status: 'suspended',
      updatedAt: BigInt(Date.now()),
    });

    return {
      message: MESSAGES.ADMIN.PRODUCT_SUSPENDED,
      data: updated,
    };
  }

  async activateProduct(adminId: number, productId: number) {
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

    if (product.status !== 'suspended') {
      throw new ForbiddenException({
        message: MESSAGES.PRODUCT.INVALID_STATUS_TRANSITION,
        errorCode: ERROR_CODES.PRODUCT_INVALID_STATUS_TRANSITION,
      });
    }

    const updated = await this.productRepository.update(productId, {
      status: 'active',
      updatedAt: BigInt(Date.now()),
    });

    return {
      message: MESSAGES.ADMIN.PRODUCT_ACTIVATED,
      data: updated,
    };
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
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      message: `Bulk approve completed: ${success} succeeded, ${failed} failed`,
      data: {
        success,
        failed,
        total: productIds.length,
      },
    };
  }
}
