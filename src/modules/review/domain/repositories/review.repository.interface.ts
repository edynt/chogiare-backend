import { Review } from '../entities/review.entity';

export const REVIEW_REPOSITORY = 'REVIEW_REPOSITORY';

export interface IReviewRepository {
  findById(id: number): Promise<Review | null>;
  findAll(query: {
    page?: number;
    pageSize?: number;
    productId?: number;
    userId?: number;
    storeId?: number;
    rating?: number;
  }): Promise<{ reviews: Review[]; total: number }>;
  create(data: {
    productId: number;
    userId: number;
    orderId?: number;
    rating: number;
    title?: string;
    comment?: string;
    isVerified: boolean;
    images?: string[];
  }): Promise<Review>;
  update(id: number, data: Partial<Review>): Promise<Review>;
  delete(id: number): Promise<void>;
  addImage(reviewId: number, imageUrl: string): Promise<void>;
  removeImages(reviewId: number): Promise<void>;
  getImages(reviewId: number): Promise<string[]>;
  markHelpful(reviewId: number, userId: number): Promise<void>;
  unmarkHelpful(reviewId: number, userId: number): Promise<void>;
  isHelpfulMarked(reviewId: number, userId: number): Promise<boolean>;
  getHelpfulCount(reviewId: number): Promise<number>;
}
