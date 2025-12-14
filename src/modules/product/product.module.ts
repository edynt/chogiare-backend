import { Module } from '@nestjs/common';
import { ProductController } from './interfaces/controllers/product.controller';
import { SellerProductController } from './interfaces/controllers/seller-product.controller';
import { ProductService } from './application/services/product.service';
import { ProductRepository } from './infrastructure/repositories/product.repository';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository.interface';
import { CategoryModule } from '@modules/category/category.module';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule, CategoryModule],
  controllers: [ProductController, SellerProductController],
  providers: [
    ProductService,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductRepository,
    },
  ],
  exports: [ProductService, PRODUCT_REPOSITORY],
})
export class ProductModule {}
