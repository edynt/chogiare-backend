/**
 * Category Repository Interface (Port)
 * Stub interface for Category module
 */
export interface ICategoryRepository {
  findById(id: string): Promise<any | null>;
  findBySlug(slug: string): Promise<any | null>;
  findMany(filters: any): Promise<{ items: any[]; total: number }>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  findTree(): Promise<any[]>;
}

