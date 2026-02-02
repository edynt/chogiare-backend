import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { PRODUCT_STATUS } from '@common/constants/enum.constants';
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
      status?: number;
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

    return result;
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

    if (product.status !== PRODUCT_STATUS.DRAFT) {
      throw new ForbiddenException({
        message: MESSAGES.PRODUCT.INVALID_STATUS_TRANSITION,
        errorCode: ERROR_CODES.PRODUCT_INVALID_STATUS_TRANSITION,
      });
    }

    const updated = await this.productRepository.update(productId, {
      status: PRODUCT_STATUS.ACTIVE,
      updatedAt: BigInt(Date.now()),
    });

    return updated;
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
      status: PRODUCT_STATUS.OUT_OF_STOCK,
      updatedAt: BigInt(Date.now()),
    });

    return updated;
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

    if (product.status !== PRODUCT_STATUS.OUT_OF_STOCK) {
      throw new ForbiddenException({
        message: MESSAGES.PRODUCT.INVALID_STATUS_TRANSITION,
        errorCode: ERROR_CODES.PRODUCT_INVALID_STATUS_TRANSITION,
      });
    }

    const updated = await this.productRepository.update(productId, {
      status: PRODUCT_STATUS.ACTIVE,
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
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      success,
      failed,
      total: productIds.length,
    };
  }
}
