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
   * Trigger backup manually and send email notification.
   * Usage: GET /api/backup/trigger
   */
  @Get('trigger')
  @Public()
  @SkipHeaderValidation()
  @ApiOperation({
    summary: 'Trigger manual backup',
    description: 'Trigger a database backup manually and send email notification.',
  })
  @ApiResponse({ status: 200, description: 'Backup triggered successfully' })
  async triggerBackup() {
    this.logger.log('Manual backup triggered via API');
    const result = await this.backupService.runBackupAndNotify();

    return {
      success: result.success,
      fileName: result.fileName,
      sizeBytes: result.sizeBytes,
      error: result.error,
    };
  }
}
