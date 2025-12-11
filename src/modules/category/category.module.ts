import { Module } from '@nestjs/common';
import { CategoryController } from './interfaces/controllers/category.controller';
import { CategoryService } from './application/services/category.service';
import { CategoryRepository } from './infrastructure/repositories/category.repository';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository.interface';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    {
      provide: CATEGORY_REPOSITORY,
      useClass: CategoryRepository,
    },
  ],
  exports: [CategoryService, CATEGORY_REPOSITORY],
})
export class CategoryModule {}
