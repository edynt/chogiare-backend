import { Module } from '@nestjs/common';
import { DatabaseModule } from '@common/database/database.module';
import { ProductModule } from '@modules/product/product.module';
import { AdminProductService } from './application/services/admin-product.service';
import { AdminProductController } from './interfaces/controllers/admin-product.controller';

@Module({
  imports: [DatabaseModule, ProductModule],
  controllers: [AdminProductController],
  providers: [AdminProductService],
  exports: [AdminProductService],
})
export class AdminProductsModule {}
