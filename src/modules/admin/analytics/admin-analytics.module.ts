import { Module } from '@nestjs/common';
import { AdminAnalyticsController } from './interfaces/controllers/admin-analytics.controller';
import { AdminAnalyticsService } from './application/services/admin-analytics.service';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminAnalyticsController],
  providers: [AdminAnalyticsService],
  exports: [AdminAnalyticsService],
})
export class AdminAnalyticsModule {}
