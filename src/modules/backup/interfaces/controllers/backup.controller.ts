import { Controller, Get, Logger, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
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

  /**
   * Export database and download as zip file directly.
   * Usage: GET /api/backup/export (no authentication required, no S3 needed)
   */
  @Get('export')
  @Public()
  @SkipHeaderValidation()
  @ApiOperation({
    summary: 'Export database as downloadable zip',
    description:
      'Run pg_dump, sanitize, zip, and return the file directly for download. No S3 or email required.',
  })
  @ApiResponse({ status: 200, description: 'Zip file download' })
  async exportBackup(@Res() res: Response) {
    this.logger.log('Database export triggered via API');

    const result = await this.backupService.createBackup();

    if (!result.success || !result.zipPath) {
      res.status(500).json({ success: false, error: result.error || 'Backup failed' });
      return;
    }

    // Stream zip file as download response
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.sizeBytes!);

    const stream = fs.createReadStream(result.zipPath);
    stream.pipe(res);

    // Cleanup temp file after streaming completes
    stream.on('end', () => this.backupService.cleanupFile(result.zipPath!));
    stream.on('error', () => this.backupService.cleanupFile(result.zipPath!));
  }
}
