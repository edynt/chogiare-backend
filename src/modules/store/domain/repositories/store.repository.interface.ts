/**
 * Store Repository Interface (Port)
 * Stub interface for Store module
 */
export interface IStoreRepository {
  findById(id: string): Promise<any | null>;
  findBySlug(slug: string): Promise<any | null>;
  findByUserId(userId: string): Promise<any | null>;
  findMany(filters: any): Promise<{ items: any[]; total: number }>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
}

