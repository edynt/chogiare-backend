import { Module } from '@nestjs/common';
import { DatabaseModule } from '@common/database/database.module';
import { ProductModule } from '@modules/product/product.module';
import { CategoryModule } from '@modules/category/category.module';
import { ProductImportExportService } from './application/services/product-import-export.service';
import { ProductImportExportController } from './interfaces/controllers/product-import-export.controller';

@Module({
  imports: [DatabaseModule, ProductModule, CategoryModule],
  controllers: [ProductImportExportController],
  providers: [ProductImportExportService],
  exports: [ProductImportExportService],
})
export class ProductImportExportModule {}
