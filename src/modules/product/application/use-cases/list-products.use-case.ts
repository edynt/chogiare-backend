import { Injectable, Inject } from '@nestjs/common';
import { IProductRepository, ProductFilters } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(filters: ProductFilters): Promise<{
    items: Product[];
    total: number;
  }> {
    // Default filters for public listing
    const defaultFilters: ProductFilters = {
      isActive: true,
      status: 'active',
      ...filters,
    };

    return this.productRepository.findMany(defaultFilters);
  }

  async findBySeller(sellerId: string, filters?: ProductFilters): Promise<{
    items: Product[];
    total: number;
  }> {
    return this.productRepository.findBySeller(sellerId, filters);
  }

  async findByCategory(categoryId: string, filters?: ProductFilters): Promise<{
    items: Product[];
    total: number;
  }> {
    return this.productRepository.findByCategory(categoryId, filters);
  }

  async findByStore(storeId: string, filters?: ProductFilters): Promise<{
    items: Product[];
    total: number;
  }> {
    return this.productRepository.findByStore(storeId, filters);
  }

  async search(query: string, filters?: ProductFilters): Promise<{
    items: Product[];
    total: number;
  }> {
    const defaultFilters: ProductFilters = {
      isActive: true,
      status: 'active',
      ...filters,
    };

    return this.productRepository.search(query, defaultFilters);
  }

  async getFeatured(limit: number = 10): Promise<Product[]> {
    return this.productRepository.findFeatured(limit);
  }
}


