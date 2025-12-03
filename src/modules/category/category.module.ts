import { Module } from '@nestjs/common';
import { CategoryService } from './application/services/category.service';
import { CategoryController } from './interfaces/controllers/category.controller';
import { CategoryRepository } from './infrastructure/repositories/category.repository';
import {
  CATEGORY_REPOSITORY,
  ICategoryRepository,
} from './domain/repositories/category.repository.interface';
import { DatabaseModule } from '@common/database/database.module';
import { LoggerModule } from '@common/logger/logger.module';

@Module({
  imports: [DatabaseModule, LoggerModule],
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

