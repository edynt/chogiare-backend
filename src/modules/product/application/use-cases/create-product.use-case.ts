import { Injectable, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { ICategoryRepository } from '../../../category/domain/repositories/category.repository.interface';
import { IStoreRepository } from '../../../store/domain/repositories/store.repository.interface';

/**
 * Create Product Use Case
 * Business logic for creating a new product
 */
@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    @Inject('IStoreRepository')
    private readonly storeRepository: IStoreRepository,
  ) {}

  async execute(
    sellerId: string,
    dto: CreateProductDto,
  ): Promise<Product> {
    // Validate category exists
    const category = await this.categoryRepository.findById(dto.categoryId);
    if (!category) {
      throw new BadRequestException('Category not found');
    }

    // Validate store belongs to seller (if provided)
    if (dto.storeId) {
      const store = await this.storeRepository.findById(dto.storeId);
      if (!store || store.userId !== sellerId) {
        throw new BadRequestException('Store not found or does not belong to seller');
      }
    }

    // Check SKU uniqueness
    if (dto.sku) {
      const skuExists = await this.productRepository.existsBySku(dto.sku);
      if (skuExists) {
        throw new ConflictException('SKU already exists');
      }
    }

    // Calculate available stock
    const stock = dto.stock || 0;
    const availableStock = stock - (dto.reservedStock || 0);

    // Calculate profit if cost price provided
    let profit: number | null = null;
    let profitMargin: number | null = null;
    if (dto.costPrice && dto.price) {
      profit = Number(dto.price) - Number(dto.costPrice);
      profitMargin = (profit / Number(dto.price)) * 100;
    }

    // Create product data
    const productData = {
      title: dto.title,
      description: dto.description || null,
      price: dto.price,
      originalPrice: dto.originalPrice || null,
      wholesalePrice: dto.wholesalePrice || null,
      minOrderQuantity: dto.minOrderQuantity || null,
      categoryId: dto.categoryId,
      sellerId,
      storeId: dto.storeId || null,
      condition: dto.condition,
      tags: dto.tags || [],
      location: dto.location || null,
      stock,
      minStock: dto.minStock || 0,
      maxStock: dto.maxStock || null,
      reservedStock: 0,
      availableStock,
      costPrice: dto.costPrice || null,
      sellingPrice: dto.price,
      profit,
      profitMargin,
      sku: dto.sku || null,
      barcode: dto.barcode || null,
      weight: dto.weight || null,
      dimensions: dto.dimensions || null,
      supplier: dto.supplier || null,
      status: dto.status || 'draft',
      badges: dto.badges || [],
      rating: 0,
      reviewCount: 0,
      viewCount: 0,
      salesCount: 0,
      isFeatured: false,
      isPromoted: false,
      isActive: true,
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
    };

    // Create product
    const product = await this.productRepository.create(productData);

    return product;
  }
}


