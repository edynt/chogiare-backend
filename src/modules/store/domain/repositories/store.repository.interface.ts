import { Store } from '../entities/store.entity';

export const STORE_REPOSITORY = 'STORE_REPOSITORY';

export interface IStoreRepository {
  findById(id: number): Promise<Store | null>;
  findByUserId(userId: number): Promise<Store | null>;
  findBySlug(slug: string): Promise<Store | null>;
  findAll(query: {
    page?: number;
    pageSize?: number;
    search?: string;
    isVerified?: boolean;
    isActive?: boolean;
  }): Promise<{ stores: Store[]; total: number }>;
  create(data: {
    userId: number;
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    logo?: string;
    banner?: string;
    contactInfo?: Record<string, unknown>;
    addressInfo?: Record<string, unknown>;
    businessInfo?: Record<string, unknown>;
    businessHours?: Record<string, unknown>;
    policies?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<Store>;
  update(id: number, data: Partial<Store>): Promise<Store>;
  delete(id: number): Promise<void>;
  updateStats(
    id: number,
    stats: {
      productCount?: number;
      reviewCount?: number;
      followerCount?: number;
      rating?: number;
    },
  ): Promise<void>;
}
