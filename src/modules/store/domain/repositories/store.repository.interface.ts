import { Store } from '../entities/store.entity';

export const STORE_REPOSITORY = 'STORE_REPOSITORY';

export interface IStoreRepository {
  findById(id: string): Promise<Store | null>;
  findBySlug(slug: string): Promise<Store | null>;
  findByUserId(userId: string): Promise<Store | null>;
  findAll(options?: {
    search?: string;
    isVerified?: boolean;
    isActive?: boolean;
    city?: string;
    state?: string;
    country?: string;
    skip?: number;
    take?: number;
  }): Promise<Store[]>;
  create(data: Omit<Store, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'productCount' | 'followerCount'>): Promise<Store>;
  update(id: string, data: Partial<Store>): Promise<Store>;
  delete(id: string): Promise<void>;
  count(options?: {
    search?: string;
    isVerified?: boolean;
    isActive?: boolean;
    city?: string;
    state?: string;
    country?: string;
  }): Promise<number>;
}

