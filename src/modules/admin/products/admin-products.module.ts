import { Module } from '@nestjs/common';
import { DatabaseModule } from '@common/database/database.module';
import { ProductModule } from '@modules/product/product.module';
import { CategoryModule } from '@modules/category/category.module';
import { AdminProductService } from './application/services/admin-product.service';
import { AdminProductController } from './interfaces/controllers/admin-product.controller';
import { AdminModerationProductService } from './application/services/admin-moderation-product.service';
import { AdminModerationProductController } from './interfaces/controllers/admin-moderation-product.controller';

@Module({
  imports: [DatabaseModule, ProductModule, CategoryModule],
  controllers: [AdminProductController, AdminModerationProductController],
  providers: [AdminProductService, AdminModerationProductService],
  exports: [AdminProductService, AdminModerationProductService],
})
export class AdminProductsModule {}
