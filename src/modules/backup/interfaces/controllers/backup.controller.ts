import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { SkipHeaderValidation } from '@common/decorators/skip-header-validation.decorator';
import { BackupService } from '../../application/services/backup.service';

@ApiTags('Backup')
@Controller('backup')
export class BackupController {
  private readonly logger = new Logger(BackupController.name);

  constructor(private readonly backupService: BackupService) {}

  /**
   * Trigger backup manually: pg_dump → zip → S3 upload → email notification.
   * Usage: GET /api/backup/trigger (no authentication required)
   */
  @Get('trigger')
  @Public()
  @SkipHeaderValidation()
  @ApiOperation({
    summary: 'Trigger manual backup',
    description:
      'Trigger database backup, upload to S3, and send email notification. No authentication required.',
  })
  @ApiResponse({ status: 200, description: 'Backup triggered and uploaded to S3' })
  async triggerBackup() {
    this.logger.log('Manual backup triggered via API');
    const result = await this.backupService.runBackupAndNotify();

    return {
      success: result.success,
      fileName: result.fileName,
      sizeBytes: result.sizeBytes,
      s3Key: result.s3Key,
      error: result.error,
    };
  }
}
