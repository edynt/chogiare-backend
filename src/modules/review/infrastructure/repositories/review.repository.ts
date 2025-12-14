import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { IReviewRepository } from '@modules/review/domain/repositories/review.repository.interface';
import { Review } from '@modules/review/domain/entities/review.entity';

@Injectable()
export class ReviewRepository implements IReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Review | null> {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return null;
    }

    return this.toDomainReview(review);
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    productId?: number;
    userId?: number;
    storeId?: number;
    rating?: number;
  }): Promise<{ reviews: Review[]; total: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.rating) {
      where.rating = query.rating;
    }

    if (query.storeId) {
      where.product = {
        storeId: query.storeId,
      };
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews: reviews.map((review) => this.toDomainReview(review)),
      total,
    };
  }

  async create(data: {
    productId: number;
    userId: number;
    orderId?: number;
    rating: number;
    title?: string;
    comment?: string;
    isVerified: boolean;
    images?: string[];
  }): Promise<Review> {
    const now = BigInt(Date.now());
    const review = await this.prisma.review.create({
      data: {
        productId: data.productId,
        userId: data.userId,
        orderId: data.orderId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        isVerified: data.isVerified,
        reviewMetadata: {},
        createdAt: now,
        updatedAt: now,
      },
    });

    if (data.images && data.images.length > 0) {
      await Promise.all(
        data.images.map((imageUrl) =>
          this.prisma.reviewImage.create({
            data: {
              reviewId: review.id,
              imageUrl,
              createdAt: now,
            },
          }),
        ),
      );
    }

    return this.toDomainReview(review);
  }

  async update(id: number, data: Partial<Review>): Promise<Review> {
    const updateData: Record<string, unknown> = {
      updatedAt: BigInt(Date.now()),
    };

    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.comment !== undefined) updateData.comment = data.comment;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;

    const review = await this.prisma.review.update({
      where: { id },
      data: updateData,
    });

    return this.toDomainReview(review);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.review.delete({
      where: { id },
    });
  }

  async addImage(reviewId: number, imageUrl: string): Promise<void> {
    await this.prisma.reviewImage.create({
      data: {
        reviewId,
        imageUrl,
        createdAt: BigInt(Date.now()),
      },
    });
  }

  async removeImages(reviewId: number): Promise<void> {
    await this.prisma.reviewImage.deleteMany({
      where: { reviewId },
    });
  }

  async getImages(reviewId: number): Promise<string[]> {
    const images = await this.prisma.reviewImage.findMany({
      where: { reviewId },
      orderBy: { createdAt: 'asc' },
    });
    return images.map((img) => img.imageUrl);
  }

  private toDomainReview(review: {
    id: number;
    productId: number;
    userId: number;
    orderId: number | null;
    rating: number;
    title: string | null;
    comment: string | null;
    isVerified: boolean;
    reviewMetadata: unknown;
    createdAt: bigint;
    updatedAt: bigint;
  }): Review {
    return {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      orderId: review.orderId || undefined,
      rating: review.rating,
      title: review.title || undefined,
      comment: review.comment || undefined,
      isVerified: review.isVerified,
      reviewMetadata: review.reviewMetadata as Record<string, unknown>,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}


