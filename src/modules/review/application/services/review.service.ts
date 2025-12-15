import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import {
  IReviewRepository,
  REVIEW_REPOSITORY,
} from '@modules/review/domain/repositories/review.repository.interface';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { QueryReviewDto } from '../dto/query-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: number, createReviewDto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: createReviewDto.productId },
    });

    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    if (createReviewDto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: createReviewDto.orderId },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new NotFoundException({
          message: MESSAGES.ORDER.NOT_FOUND,
          errorCode: ERROR_CODES.ORDER_NOT_FOUND,
        });
      }

      if (order.userId !== userId) {
        throw new ForbiddenException({
          message: MESSAGES.ORDER.UNAUTHORIZED_ACCESS,
          errorCode: ERROR_CODES.ORDER_UNAUTHORIZED_ACCESS,
        });
      }

      const hasProductInOrder = order.items.some(
        (item) => item.productId === createReviewDto.productId,
      );
      if (!hasProductInOrder) {
        throw new BadRequestException({
          message: 'Product not found in order',
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }
    }

    const existingReview = createReviewDto.orderId
      ? await this.prisma.review.findUnique({
          where: {
            productId_userId_orderId: {
              productId: createReviewDto.productId,
              userId,
              orderId: createReviewDto.orderId,
            },
          },
        })
      : await this.prisma.review.findFirst({
          where: {
            productId: createReviewDto.productId,
            userId,
            orderId: null,
          },
        });

    if (existingReview) {
      throw new BadRequestException({
        message: 'Review already exists for this product and order',
        errorCode: ERROR_CODES.CONFLICT,
      });
    }

    const review = await this.reviewRepository.create({
      productId: createReviewDto.productId,
      userId,
      orderId: createReviewDto.orderId,
      rating: createReviewDto.rating,
      title: createReviewDto.title,
      comment: createReviewDto.comment,
      isVerified: createReviewDto.isVerified,
      images: createReviewDto.images,
    });

    await this.updateProductRating(createReviewDto.productId);

    return this.formatReviewResponse(review);
  }

  async findAll(queryDto: QueryReviewDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;

    const result = await this.reviewRepository.findAll({
      page,
      pageSize,
      productId: queryDto.productId,
      userId: queryDto.userId,
      storeId: queryDto.storeId,
      rating: queryDto.rating,
    });

    const reviews = await Promise.all(
      result.reviews.map(async (review) => await this.formatReviewResponse(review)),
    );

    return {
      reviews,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async findOne(id: number) {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundException({
        message: 'Review not found',
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    return this.formatReviewResponse(review);
  }

  async update(id: number, userId: number, updateReviewDto: UpdateReviewDto) {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundException({
        message: 'Review not found',
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    if (review.userId !== userId) {
      throw new ForbiddenException({
        message: 'Unauthorized to update this review',
        errorCode: ERROR_CODES.UNAUTHORIZED,
      });
    }

    if (updateReviewDto.images !== undefined) {
      await this.reviewRepository.removeImages(id);
      if (updateReviewDto.images.length > 0) {
        await Promise.all(
          updateReviewDto.images.map((imageUrl) => this.reviewRepository.addImage(id, imageUrl)),
        );
      }
    }

    const updatedReview = await this.reviewRepository.update(id, {
      rating: updateReviewDto.rating,
      title: updateReviewDto.title,
      comment: updateReviewDto.comment,
      isVerified: updateReviewDto.isVerified,
    });

    if (updateReviewDto.rating !== undefined) {
      await this.updateProductRating(review.productId);
    }

    return this.formatReviewResponse(updatedReview);
  }

  async delete(id: number, userId: number) {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundException({
        message: 'Review not found',
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    if (review.userId !== userId) {
      throw new ForbiddenException({
        message: 'Unauthorized to delete this review',
        errorCode: ERROR_CODES.UNAUTHORIZED,
      });
    }

    await this.reviewRepository.delete(id);
    await this.updateProductRating(review.productId);
  }

  async markHelpful(id: number, userId: number) {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundException({
        message: 'Review not found',
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    await this.reviewRepository.markHelpful(id, userId);
  }

  async unmarkHelpful(id: number, userId: number) {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundException({
        message: 'Review not found',
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    await this.reviewRepository.unmarkHelpful(id, userId);
  }

  async getStats(productId?: number, storeId?: number, userId?: number) {
    const where: Record<string, unknown> = {};

    if (productId) {
      where.productId = productId;
    }

    if (storeId) {
      where.product = {
        storeId,
      };
    }

    if (userId) {
      where.userId = userId;
    }

    const reviews = await this.prisma.review.findMany({
      where,
      select: {
        rating: true,
        isVerified: true,
      },
    });

    const totalReviews = reviews.length;
    const verifiedReviews = reviews.filter((r) => r.isVerified).length;
    const averageRating =
      totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
    });

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingCounts,
      verifiedReviews,
    };
  }

  private async updateProductRating(productId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const averageRating =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: averageRating,
        reviewCount: reviews.length,
      },
    });
  }

  private async formatReviewResponse(review: {
    id: number;
    productId: number;
    userId: number;
    orderId?: number;
    rating: number;
    title?: string;
    comment?: string;
    isVerified: boolean;
    helpfulCount: number;
    createdAt: bigint;
    updatedAt: bigint;
  }) {
    const [user, product, images] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: review.userId },
        include: { userInfo: true },
      }),
      this.prisma.product.findUnique({
        where: { id: review.productId },
        select: {
          id: true,
          title: true,
          images: true,
        },
      }),
      this.reviewRepository.getImages(review.id),
    ]);

    return {
      id: review.id.toString(),
      productId: review.productId.toString(),
      userId: review.userId,
      orderId: review.orderId?.toString(),
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images,
      isVerified: review.isVerified,
      helpful: review.helpfulCount,
      userName: user?.userInfo?.fullName || undefined,
      userEmail: user?.email || undefined,
      userAvatar: user?.userInfo?.avatarUrl || undefined,
      productName: product?.title || undefined,
      productImage: product?.images?.[0] || undefined,
      createdAt: new Date(Number(review.createdAt)).toISOString(),
      updatedAt: new Date(Number(review.updatedAt)).toISOString(),
    };
  }
}
