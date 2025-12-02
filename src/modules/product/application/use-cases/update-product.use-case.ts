import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { IProductRepository, UpdateProductData } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(
    id: string,
    sellerId: string,
    data: UpdateProductData,
  ): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check ownership (seller can only update their own products)
    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Check SKU uniqueness if updating SKU
    if (data.sku && data.sku !== product.sku) {
      const skuExists = await this.productRepository.existsBySku(data.sku, id);
      if (skuExists) {
        throw new ForbiddenException('SKU already exists');
      }
    }

    return this.productRepository.update(id, data);
  }
}


