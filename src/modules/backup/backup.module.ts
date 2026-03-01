import { Module } from '@nestjs/common';
import { BackupService } from './application/services/backup.service';
import { BackupScheduler } from './application/schedulers/backup.scheduler';
import { BackupController } from './interfaces/controllers/backup.controller';

@Module({
  controllers: [BackupController],
  providers: [BackupService, BackupScheduler],
})
export class BackupModule {}
