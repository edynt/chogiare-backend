import { Module } from '@nestjs/common';
import { ReviewController } from './interfaces/controllers/review.controller';
import { ReviewService } from './application/services/review.service';
import { ReviewRepository } from './infrastructure/repositories/review.repository';
import { REVIEW_REPOSITORY } from './domain/repositories/review.repository.interface';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    {
      provide: REVIEW_REPOSITORY,
      useClass: ReviewRepository,
    },
  ],
  exports: [ReviewService, REVIEW_REPOSITORY],
})
export class ReviewModule {}
