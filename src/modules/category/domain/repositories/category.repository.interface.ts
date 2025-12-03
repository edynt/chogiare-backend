import { Category } from '../entities/category.entity';

export const CATEGORY_REPOSITORY = 'CATEGORY_REPOSITORY';

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(options?: {
    parentId?: string | null;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }): Promise<Category[]>;
  create(data: Omit<Category, 'id' | 'createdAt' | 'productCount'>): Promise<Category>;
  update(id: string, data: Partial<Category>): Promise<Category>;
  delete(id: string): Promise<void>;
  count(options?: { parentId?: string | null; isActive?: boolean }): Promise<number>;
}

