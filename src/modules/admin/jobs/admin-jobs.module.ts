import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminJobService } from './application/services/admin-job.service';
import { AdminJobController } from './interfaces/controllers/admin-job.controller';
import { CleanupModule } from '@modules/cleanup/cleanup.module';

@Module({
  imports: [ScheduleModule, CleanupModule],
  controllers: [AdminJobController],
  providers: [AdminJobService],
  exports: [AdminJobService],
})
export class AdminJobsModule {}

