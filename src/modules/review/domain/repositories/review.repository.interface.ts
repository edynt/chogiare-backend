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
  }): Promise<Review>;
  update(id: number, data: Partial<Review>): Promise<Review>;
  delete(id: number): Promise<void>;
}
