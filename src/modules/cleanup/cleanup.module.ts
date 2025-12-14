import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@common/database/database.module';
import { CleanupService } from './application/services/cleanup.service';
import { CleanupScheduler } from './application/schedulers/cleanup.scheduler';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule],
  providers: [CleanupService, CleanupScheduler],
  exports: [CleanupService],
})
export class CleanupModule {}

