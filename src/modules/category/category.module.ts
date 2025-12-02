import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { CategoryRepository } from './infrastructure/repositories/category.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: 'ICategoryRepository',
      useClass: CategoryRepository,
    },
  ],
  exports: ['ICategoryRepository'],
})
export class CategoryModule {}

