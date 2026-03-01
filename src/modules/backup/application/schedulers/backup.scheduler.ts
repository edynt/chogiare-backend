import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BackupService } from '../services/backup.service';

@Injectable()
export class BackupScheduler {
  private readonly logger = new Logger(BackupScheduler.name);

  constructor(private readonly backupService: BackupService) {}

  // Run daily at 23:55 (end of day)
  @Cron('55 23 * * *')
  async handleDailyBackup() {
    this.logger.log('Starting scheduled daily backup');
    const result = await this.backupService.runBackupAndNotify();

    if (result.success) {
      this.logger.log(`Daily backup completed successfully: ${result.fileName}`);
    } else {
      this.logger.error(`Daily backup failed: ${result.error}`);
    }
  }
}
