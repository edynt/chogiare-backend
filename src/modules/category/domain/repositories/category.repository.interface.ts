import { Category } from '../entities/category.entity';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface ICategoryRepository {
  findById(id: number): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(options?: {
    parentId?: number | null;
    isActive?: boolean;
    includeChildren?: boolean;
  }): Promise<Category[]>;
  create(category: Partial<Category>): Promise<Category>;
  update(id: number, category: Partial<Category>): Promise<Category>;
  delete(id: number): Promise<void>;
  exists(id: number): Promise<boolean>;
  updateProductCount(id: number, increment: number): Promise<void>;
}
