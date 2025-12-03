import { Module } from '@nestjs/common';
import { ProductService } from './application/services/product.service';
import { ProductController } from './interfaces/controllers/product.controller';
import { ProductRepository } from './infrastructure/repositories/product.repository';
import {
  PRODUCT_REPOSITORY,
  IProductRepository,
} from './domain/repositories/product.repository.interface';
import { DatabaseModule } from '@common/database/database.module';
import { LoggerModule } from '@common/logger/logger.module';

@Module({
  imports: [DatabaseModule, LoggerModule],
  controllers: [ProductController],
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

