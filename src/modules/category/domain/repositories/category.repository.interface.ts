import { Category } from '../entities/category.entity';

export const CATEGORY_REPOSITORY = 'CATEGORY_REPOSITORY';

export interface ICategoryRepository {
  findById(id: number): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(options?: {
    parentId?: number | null;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }): Promise<Category[]>;
  create(data: Omit<Category, 'id' | 'createdAt' | 'productCount'>): Promise<Category>;
  update(id: number, data: Partial<Category>): Promise<Category>;
  delete(id: number): Promise<void>;
  count(options?: { parentId?: number | null; isActive?: boolean }): Promise<number>;
}

