import { Module } from '@nestjs/common';
import { ProductController } from './interfaces/controllers/product.controller';
import { ProductRepository } from './infrastructure/repositories/product.repository';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { GetProductUseCase } from './application/use-cases/get-product.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { PrismaModule } from '../../database/prisma.module';
import { CategoryModule } from '../category/category.module';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [
    PrismaModule,
    CategoryModule,
    StoreModule,
  ],
  controllers: [ProductController],
  providers: [
    // Repository
    {
      provide: 'IProductRepository',
      useClass: ProductRepository,
    },
    // Use Cases
    CreateProductUseCase,
    GetProductUseCase,
    ListProductsUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
  ],
  exports: [
    'IProductRepository',
    CreateProductUseCase,
    GetProductUseCase,
    ListProductsUseCase,
  ],
})
export class ProductModule {}


