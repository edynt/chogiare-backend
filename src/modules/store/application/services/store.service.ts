import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import {
  IStoreRepository,
  STORE_REPOSITORY,
} from '@modules/store/domain/repositories/store.repository.interface';
import { CreateStoreDto } from '../dto/create-store.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { QueryStoreDto } from '../dto/query-store.dto';

@Injectable()
export class StoreService {
  private readonly cdnUrl: string;
  private readonly s3Bucket: string;
  private readonly s3Region: string;
  private readonly s3Endpoint: string;

  constructor(
    @Inject(STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
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

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async ensureUniqueSlug(slug: string, excludeId?: number): Promise<string> {
    let finalSlug = slug;
    let counter = 1;

    while (true) {
      const existing = await this.storeRepository.findBySlug(finalSlug);
      if (!existing || (excludeId && existing.id === excludeId)) {
        return finalSlug;
      }
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  async create(userId: number, createStoreDto: CreateStoreDto) {
    const existingStore = await this.storeRepository.findByUserId(userId);
    if (existingStore) {
      throw new BadRequestException({
        message: MESSAGES.STORE.ALREADY_EXISTS,
        errorCode: ERROR_CODES.STORE_ALREADY_EXISTS || 'STORE_ALREADY_EXISTS',
      });
    }

    const slug = await this.ensureUniqueSlug(this.generateSlug(createStoreDto.name));

    const contactInfo: Record<string, unknown> = {};
    if (createStoreDto.website) contactInfo.website = createStoreDto.website;
    if (createStoreDto.phone) contactInfo.phone = createStoreDto.phone;
    if (createStoreDto.email) contactInfo.email = createStoreDto.email;

    const addressInfo: Record<string, unknown> = {};
    if (createStoreDto.address) addressInfo.address = createStoreDto.address;
    if (createStoreDto.city) addressInfo.city = createStoreDto.city;
    if (createStoreDto.state) addressInfo.state = createStoreDto.state;
    if (createStoreDto.country) addressInfo.country = createStoreDto.country;
    if (createStoreDto.postalCode) addressInfo.postalCode = createStoreDto.postalCode;

    const store = await this.storeRepository.create({
      userId,
      name: createStoreDto.name,
      slug,
      description: createStoreDto.description,
      logo: createStoreDto.logo,
      banner: createStoreDto.banner,
      contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
      addressInfo: Object.keys(addressInfo).length > 0 ? addressInfo : undefined,
    });

    return this.formatStoreResponse(store);
  }

  async findAll(queryDto: QueryStoreDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;

    const result = await this.storeRepository.findAll({
      page,
      pageSize,
      search: queryDto.search,
      isVerified: queryDto.isVerified,
      isActive: queryDto.isActive,
    });

    const stores = await Promise.all(
      result.stores.map(async (store) => await this.formatStoreResponse(store)),
    );

    return {
      stores,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async findOne(id: number) {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      throw new NotFoundException({
        message: MESSAGES.STORE.NOT_FOUND,
        errorCode: ERROR_CODES.STORE_NOT_FOUND || 'STORE_NOT_FOUND',
      });
    }

    return this.formatStoreResponse(store);
  }

  async findByUserId(userId: number) {
    const store = await this.storeRepository.findByUserId(userId);
    if (!store) {
      throw new NotFoundException({
        message: MESSAGES.STORE.NOT_FOUND,
        errorCode: ERROR_CODES.STORE_NOT_FOUND || 'STORE_NOT_FOUND',
      });
    }

    return this.formatStoreResponse(store);
  }

  async update(id: number, userId: number, updateStoreDto: UpdateStoreDto) {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      throw new NotFoundException({
        message: MESSAGES.STORE.NOT_FOUND,
        errorCode: ERROR_CODES.STORE_NOT_FOUND || 'STORE_NOT_FOUND',
      });
    }

    if (store.userId !== userId) {
      throw new ForbiddenException({
        message: MESSAGES.STORE.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.UNAUTHORIZED || 'UNAUTHORIZED',
      });
    }

    const updateData: Partial<typeof store> = {};

    if (updateStoreDto.name !== undefined) {
      updateData.name = updateStoreDto.name;
      const slug = await this.ensureUniqueSlug(this.generateSlug(updateStoreDto.name), id);
      updateData.slug = slug;
    }

    if (updateStoreDto.description !== undefined) {
      updateData.description = updateStoreDto.description;
    }

    if (updateStoreDto.logo !== undefined) {
      updateData.logo = updateStoreDto.logo;
    }

    if (updateStoreDto.banner !== undefined) {
      updateData.banner = updateStoreDto.banner;
    }

    if (updateStoreDto.isVerified !== undefined) {
      updateData.isVerified = updateStoreDto.isVerified;
    }

    if (updateStoreDto.isActive !== undefined) {
      updateData.isActive = updateStoreDto.isActive;
    }

    const contactInfo = { ...store.contactInfo };
    if (updateStoreDto.website !== undefined) contactInfo.website = updateStoreDto.website;
    if (updateStoreDto.phone !== undefined) contactInfo.phone = updateStoreDto.phone;
    if (updateStoreDto.email !== undefined) contactInfo.email = updateStoreDto.email;
    updateData.contactInfo = contactInfo;

    const addressInfo = { ...store.addressInfo };
    if (updateStoreDto.address !== undefined) addressInfo.address = updateStoreDto.address;
    if (updateStoreDto.city !== undefined) addressInfo.city = updateStoreDto.city;
    if (updateStoreDto.state !== undefined) addressInfo.state = updateStoreDto.state;
    if (updateStoreDto.country !== undefined) addressInfo.country = updateStoreDto.country;
    if (updateStoreDto.postalCode !== undefined) addressInfo.postalCode = updateStoreDto.postalCode;
    updateData.addressInfo = addressInfo;

    const updatedStore = await this.storeRepository.update(id, updateData);

    return this.formatStoreResponse(updatedStore);
  }

  async delete(id: number, userId: number) {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      throw new NotFoundException({
        message: MESSAGES.STORE.NOT_FOUND,
        errorCode: ERROR_CODES.STORE_NOT_FOUND || 'STORE_NOT_FOUND',
      });
    }

    if (store.userId !== userId) {
      throw new ForbiddenException({
        message: MESSAGES.STORE.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.UNAUTHORIZED || 'UNAUTHORIZED',
      });
    }

    await this.storeRepository.delete(id);
  }

  async getStats(storeId?: number) {
    if (storeId) {
      const store = await this.storeRepository.findById(storeId);
      if (!store) {
        throw new NotFoundException({
          message: MESSAGES.STORE.NOT_FOUND,
          errorCode: ERROR_CODES.STORE_NOT_FOUND || 'STORE_NOT_FOUND',
        });
      }

      return {
        totalStores: 1,
        activeStores: store.isActive ? 1 : 0,
        verifiedStores: store.isVerified ? 1 : 0,
        averageRating: store.rating,
        totalProducts: store.productCount,
        totalFollowers: store.followerCount,
      };
    }

    const allStores = await this.storeRepository.findAll({ page: 1, pageSize: 10000 });
    const activeStores = allStores.stores.filter((s) => s.isActive);
    const verifiedStores = allStores.stores.filter((s) => s.isVerified);
    const totalProducts = allStores.stores.reduce((sum, s) => sum + s.productCount, 0);
    const totalFollowers = allStores.stores.reduce((sum, s) => sum + s.followerCount, 0);
    const avgRating =
      allStores.stores.length > 0
        ? allStores.stores.reduce((sum, s) => sum + s.rating, 0) / allStores.stores.length
        : 0;

    return {
      totalStores: allStores.total,
      activeStores: activeStores.length,
      verifiedStores: verifiedStores.length,
      averageRating: avgRating,
      totalProducts,
      totalFollowers,
    };
  }

  async getProductsByStore(
    storeId: number,
    query: {
      page?: number;
      pageSize?: number;
      status?: string;
      search?: string;
    },
  ) {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundException({
        message: MESSAGES.STORE.NOT_FOUND,
        errorCode: ERROR_CODES.STORE_NOT_FOUND || 'STORE_NOT_FOUND',
      });
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      storeId,
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

  private async formatStoreResponse(store: {
    id: number;
    userId: number;
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    logo?: string;
    banner?: string;
    rating: number;
    reviewCount: number;
    productCount: number;
    followerCount: number;
    isVerified: boolean;
    isActive: boolean;
    contactInfo: Record<string, unknown>;
    addressInfo: Record<string, unknown>;
    createdAt: bigint;
    updatedAt: bigint;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: store.userId },
    });

    const contactInfo = store.contactInfo || {};
    const addressInfo = store.addressInfo || {};

    return {
      id: store.id.toString(),
      userId: store.userId,
      name: store.name,
      description: store.description,
      logo: store.logo,
      banner: store.banner,
      website: (contactInfo.website as string) || undefined,
      phone: (contactInfo.phone as string) || undefined,
      email: (contactInfo.email as string) || undefined,
      address: (addressInfo.address as string) || undefined,
      city: (addressInfo.city as string) || undefined,
      state: (addressInfo.state as string) || undefined,
      country: (addressInfo.country as string) || undefined,
      postalCode: (addressInfo.postalCode as string) || undefined,
      rating: store.rating,
      reviewCount: store.reviewCount,
      productCount: store.productCount,
      followerCount: store.followerCount,
      isVerified: store.isVerified,
      isActive: store.isActive,
      userName: user?.fullName || undefined,
      userEmail: user?.email || undefined,
      createdAt: new Date(Number(store.createdAt)).toISOString(),
      updatedAt: new Date(Number(store.updatedAt)).toISOString(),
    };
  }

  async getDashboardStats(storeId: number) {
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const nowBigInt = BigInt(now.getTime());
    const lastMonthBigInt = BigInt(lastMonth.getTime());
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStartBigInt = BigInt(todayStart.getTime());

    const [
      totalProducts,
      activeProducts,
      totalOrders,
      completedOrders,
      pendingOrders,
      monthlyRevenue,
      previousMonthRevenue,
      totalViews,
      todayViews,
    ] = await Promise.all([
      this.prisma.product.count({
        where: { storeId },
      }),
      this.prisma.product.count({
        where: { storeId, status: 'active' },
      }),
      this.prisma.order.count({
        where: {
          storeId,
          createdAt: { gte: lastMonthBigInt, lt: nowBigInt },
        },
      }),
      this.prisma.order.count({
        where: {
          storeId,
          createdAt: { gte: lastMonthBigInt, lt: nowBigInt },
          status: OrderStatus.completed,
          paymentStatus: PaymentStatus.completed,
        },
      }),
      this.prisma.order.count({
        where: {
          storeId,
          createdAt: { gte: lastMonthBigInt, lt: nowBigInt },
          status: { in: [OrderStatus.pending, OrderStatus.confirmed] },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          storeId,
          createdAt: { gte: lastMonthBigInt, lt: nowBigInt },
          status: { not: OrderStatus.cancelled },
          paymentStatus: PaymentStatus.completed,
        },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: {
          storeId,
          createdAt: {
            gte: BigInt(
              new Date(
                lastMonth.getFullYear(),
                lastMonth.getMonth() - 1,
                lastMonth.getDate(),
              ).getTime(),
            ),
            lt: lastMonthBigInt,
          },
          status: { not: OrderStatus.cancelled },
          paymentStatus: PaymentStatus.completed,
        },
        _sum: { total: true },
      }),
      this.prisma.product.findMany({
        where: { storeId },
        select: { viewCount: true },
      }),
      this.prisma.product.findMany({
        where: {
          storeId,
          updatedAt: { gte: todayStartBigInt },
        },
        select: { viewCount: true },
      }),
    ]);

    const currentRevenue = monthlyRevenue._sum.total ? Number(monthlyRevenue._sum.total) : 0;
    const previousRevenue = previousMonthRevenue._sum.total
      ? Number(previousMonthRevenue._sum.total)
      : 0;
    const revenueChange =
      previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const totalViewsCount = totalViews.reduce((sum, p) => sum + (p.viewCount || 0), 0);
    const todayViewsCount = todayViews.reduce((sum, p) => sum + (p.viewCount || 0), 0);

    const previousMonthProducts = await this.prisma.product.count({
      where: {
        storeId,
        createdAt: {
          gte: BigInt(
            new Date(
              lastMonth.getFullYear(),
              lastMonth.getMonth() - 1,
              lastMonth.getDate(),
            ).getTime(),
          ),
          lt: lastMonthBigInt,
        },
      },
    });
    const productsChange =
      previousMonthProducts > 0
        ? ((totalProducts - previousMonthProducts) / previousMonthProducts) * 100
        : 0;

    const previousMonthOrders = await this.prisma.order.count({
      where: {
        storeId,
        createdAt: {
          gte: BigInt(
            new Date(
              lastMonth.getFullYear(),
              lastMonth.getMonth() - 1,
              lastMonth.getDate(),
            ).getTime(),
          ),
          lt: lastMonthBigInt,
        },
      },
    });
    const ordersChange =
      previousMonthOrders > 0
        ? ((totalOrders - previousMonthOrders) / previousMonthOrders) * 100
        : 0;

    const profit = currentRevenue * 0.2;

    return {
      totalProducts: {
        value: totalProducts,
        change: productsChange,
        changeType: productsChange >= 0 ? 'positive' : 'negative',
        subtitle: `Hoạt động: ${activeProducts}`,
      },
      revenue: {
        value: currentRevenue,
        change: revenueChange,
        changeType: revenueChange >= 0 ? 'positive' : 'negative',
        subtitle: `Lợi nhuận: ${profit.toLocaleString('vi-VN')} VNĐ`,
      },
      orders: {
        value: totalOrders,
        change: ordersChange,
        changeType: ordersChange >= 0 ? 'positive' : 'negative',
        subtitle: `Chờ xử lý: ${pendingOrders}`,
      },
      views: {
        value: totalViewsCount,
        change: 0,
        changeType: 'positive' as const,
        subtitle: `Hôm nay: ${todayViewsCount}`,
      },
    };
  }

  async getLowStockProducts(storeId: number, limit: number = 20) {
    const products = await this.prisma.product.findMany({
      where: {
        storeId,
        OR: [
          { availableStock: { lte: this.prisma.product.fields.minStock } },
          { availableStock: 0 },
        ],
      },
      select: {
        id: true,
        title: true,
        sku: true,
        availableStock: true,
        minStock: true,
        maxStock: true,
      },
      orderBy: { availableStock: 'asc' },
      take: limit,
    });

    return products.map((product) => {
      let status = 'in_stock';
      if (product.availableStock === 0) {
        status = 'out_of_stock';
      } else if (product.availableStock <= product.minStock) {
        status = 'low_stock';
      }

      return {
        id: product.id.toString(),
        name: product.title,
        sku: product.sku || '',
        currentStock: product.availableStock,
        minStock: product.minStock,
        maxStock: product.maxStock || 0,
        status,
      };
    });
  }
}
