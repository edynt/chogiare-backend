import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { execFileSync, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as archiver from 'archiver';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { APP_NAME } from '@common/constants/app.constants';

interface BackupResult {
  success: boolean;
  zipPath?: string;
  fileName?: string;
  sizeBytes?: number;
  s3Key?: string;
  error?: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly transporter: Transporter;
  private readonly recipientEmail: string;
  private readonly s3Client: S3Client;
  private readonly s3Bucket: string;
  private readonly s3Prefix: string;

  constructor(private readonly configService: ConfigService) {
    const mailConfig = this.configService.get('mail');

    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: {
        user: mailConfig.auth.user,
        pass: mailConfig.auth.pass,
      },
    });

    const recipientEmail = this.configService.get<string>('BACKUP_RECIPIENT_EMAIL');
    if (!recipientEmail) {
      throw new Error('BACKUP_RECIPIENT_EMAIL env var is required');
    }
    this.recipientEmail = recipientEmail;

    // S3 client — on EC2, auto-detects IAM instance role if keys are empty
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION', 'ap-southeast-1'),
    });
    this.s3Bucket = this.configService.get<string>('AWS_S3_BUCKET', 'chogiare-backup-data');
    this.s3Prefix = this.configService.get<string>('AWS_S3_BACKUP_PREFIX', 'backups/');
  }

  /**
   * Run full backup pipeline: pg_dump → zip → S3 upload → email notification → cleanup
   */
  async runBackupAndNotify(): Promise<BackupResult> {
    this.logger.log('Starting database backup...');

    let result: BackupResult;

    try {
      result = await this.createBackup();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Backup failed: ${errorMessage}`);
      await this.sendErrorEmail(errorMessage);
      return { success: false, error: errorMessage };
    }

    if (!result.success || !result.zipPath) {
      await this.sendErrorEmail(result.error || 'Unknown backup error');
      return result;
    }

    // Upload to S3
    try {
      const s3Key = await this.uploadToS3(result.zipPath, result.fileName!);
      result.s3Key = s3Key;
      this.logger.log(`Backup uploaded to S3: ${s3Key}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`S3 upload failed: ${errorMessage}`);
      await this.sendErrorEmail(`Backup created but S3 upload failed: ${errorMessage}`);
      this.cleanupFile(result.zipPath!);
      return { ...result, success: false, error: errorMessage };
    }

    // Send success notification email (no attachment)
    try {
      await this.sendSuccessEmail(result.s3Key!, result.fileName!, result.sizeBytes!);
      this.logger.log('Backup notification email sent');
    } catch (error) {
      // Non-fatal: backup is already on S3
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send notification email: ${errorMessage}`);
    } finally {
      this.cleanupFile(result.zipPath!);
    }

    return result;
  }

  /**
   * Upload zip file to S3
   */
  private async uploadToS3(zipPath: string, fileName: string): Promise<string> {
    if (!this.s3Bucket) {
      throw new Error('AWS_S3_BUCKET env var is not configured');
    }

    const s3Key = `${this.s3Prefix}${fileName}`;
    const fileStream = fs.createReadStream(zipPath);

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: s3Key,
          Body: fileStream,
          ContentType: 'application/zip',
        }),
      );
    } finally {
      fileStream.destroy();
    }

    return s3Key;
  }

  /**
   * Create database backup: pg_dump (plain SQL) → sanitize → .zip
   * Post-processes the SQL to strip pg_dump 18+ incompatible directives
   * (\restrict, SET transaction_timeout) so the .sql runs cleanly on PG 16.
   */
  private async createBackup(): Promise<BackupResult> {
    const dbUrl = this.configService.get<string>('DATABASE_URL') || '';
    const parsed = this.parseDatabaseUrl(dbUrl);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sqlFileName = `backup-${timestamp}.sql`;
    const zipFileName = `backup-${timestamp}.zip`;
    const tmpDir = os.tmpdir();
    const sqlPath = path.join(tmpDir, sqlFileName);
    const zipPath = path.join(tmpDir, zipFileName);

    // Resolve pg_dump binary path (handles keg-only homebrew installs)
    const pgDumpPath = this.resolvePgDumpPath();

    // Run pg_dump in plain-text SQL format
    try {
      execFileSync(
        pgDumpPath,
        [
          '-h',
          parsed.host,
          '-p',
          parsed.port,
          '-U',
          parsed.user,
          '-d',
          parsed.database,
          '-f',
          sqlPath,
          '--inserts', // use INSERT instead of COPY (works in any SQL client)
          '--clean', // add DROP statements before CREATE (overwrite existing)
          '--if-exists', // use IF EXISTS with DROP (no error if tables don't exist)
        ],
        {
          timeout: 300000, // 5 min timeout
          env: { ...process.env, PGPASSWORD: parsed.password },
        },
      );
      this.logger.log(`pg_dump completed: ${sqlPath}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`pg_dump failed: ${msg}`);
    }

    // Verify SQL file exists
    if (!fs.existsSync(sqlPath)) {
      throw new Error('pg_dump did not produce output file');
    }

    // Sanitize SQL: strip pg_dump 18+ directives incompatible with PG 16
    this.sanitizeSqlDump(sqlPath);

    // Compress to zip
    try {
      await this.createZip(sqlPath, sqlFileName, zipPath);
      this.logger.log(`Zip created: ${zipPath}`);
    } catch (error) {
      this.cleanupFile(sqlPath);
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Zip compression failed: ${msg}`);
    }

    // Cleanup SQL file (keep only zip)
    this.cleanupFile(sqlPath);

    const stats = fs.statSync(zipPath);

    return {
      success: true,
      zipPath,
      fileName: zipFileName,
      sizeBytes: stats.size,
    };
  }

  /**
   * Strip pg_dump 18+ lines that are incompatible with older PG versions:
   * - All backslash meta-commands (\restrict, \unrestrict, \connect, etc.)
   * - SET transaction_timeout (PG 17+ only)
   */
  private sanitizeSqlDump(sqlPath: string): void {
    const content = fs.readFileSync(sqlPath, 'utf-8');
    const sanitized = content
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim();
        // Remove all psql backslash meta-commands (not valid SQL)
        if (trimmed.startsWith('\\')) return false;
        if (trimmed.startsWith('SET transaction_timeout')) return false;
        return true;
      })
      .join('\n');
    fs.writeFileSync(sqlPath, sanitized, 'utf-8');
    this.logger.log('SQL dump sanitized: removed incompatible directives');
  }

  /**
   * Create zip archive from a single file
   */
  private createZip(inputPath: string, inputFileName: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      output.on('error', (err) => reject(err));
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.file(inputPath, { name: inputFileName });
      archive.finalize();
    });
  }

  /**
   * Send success notification email with S3 location (no attachment)
   */
  private async sendSuccessEmail(
    s3Key: string,
    fileName: string,
    sizeBytes: number,
  ): Promise<void> {
    const mailConfig = this.configService.get('mail');
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    await this.transporter.sendMail({
      from: `"${mailConfig.from.name}" <${mailConfig.from.email}>`,
      to: this.recipientEmail,
      subject: `[${APP_NAME}] Backup thành công - ${now}`,
      html: this.getSuccessEmailTemplate(now, fileName, sizeMB, s3Key),
    });
  }

  /**
   * Send error notification email
   */
  private async sendErrorEmail(errorMessage: string): Promise<void> {
    try {
      const mailConfig = this.configService.get('mail');
      const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

      await this.transporter.sendMail({
        from: `"${mailConfig.from.name}" <${mailConfig.from.email}>`,
        to: this.recipientEmail,
        subject: `[${APP_NAME}] ⚠️ Backup THẤT BẠI - ${now}`,
        html: this.getErrorEmailTemplate(now, errorMessage),
      });

      this.logger.log('Error notification email sent');
    } catch (emailError) {
      this.logger.error(
        'Failed to send error notification email',
        emailError instanceof Error ? emailError.stack : undefined,
      );
    }
  }

  /**
   * Resolve pg_dump binary path, checking common locations for keg-only installs
   */
  private resolvePgDumpPath(): string {
    // Check common Homebrew and system paths
    const candidates = [
      '/opt/homebrew/opt/libpq/bin/pg_dump', // Apple Silicon Homebrew
      '/usr/local/opt/libpq/bin/pg_dump', // Intel Homebrew
      '/opt/homebrew/bin/pg_dump',
      '/usr/local/bin/pg_dump',
      '/usr/bin/pg_dump',
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        this.logger.log(`Using pg_dump at: ${candidate}`);
        return candidate;
      }
    }

    // Fallback: try to find via `which` command
    try {
      const result = execSync('which pg_dump', { encoding: 'utf-8' }).trim();
      if (result) return result;
    } catch {
      // which failed, pg_dump not in PATH
    }

    // Last resort: use bare name and let OS resolve
    return 'pg_dump';
  }

  /**
   * Parse DATABASE_URL into components
   */
  private parseDatabaseUrl(url: string): {
    host: string;
    port: string;
    user: string;
    password: string;
    database: string;
  } {
    // postgresql://user:password@host:port/database?schema=public
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);

    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5],
    };
  }

  /**
   * Safely delete a temp file
   */
  private cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      this.logger.warn(`Failed to cleanup temp file: ${filePath}`);
    }
  }

  // -- Email Templates --

  private getSuccessEmailTemplate(
    dateTime: string,
    fileName: string,
    sizeMB: string,
    s3Key: string,
  ): string {
    const safeDateTime = this.escapeHtml(dateTime);
    const safeFileName = this.escapeHtml(fileName);
    const safeSizeMB = this.escapeHtml(sizeMB);
    const safeS3Key = this.escapeHtml(s3Key);
    const safeBucket = this.escapeHtml(this.s3Bucket);
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ✅ Backup Thành Công
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Database backup đã được thực hiện thành công và upload lên S3.
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0fdf4; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #166534; font-size: 14px;"><strong>Thời gian:</strong> ${safeDateTime}</p>
                    <p style="margin: 0 0 8px; color: #166534; font-size: 14px;"><strong>File:</strong> ${safeFileName}</p>
                    <p style="margin: 0 0 8px; color: #166534; font-size: 14px;"><strong>Dung lượng:</strong> ${safeSizeMB} MB</p>
                    <p style="margin: 0 0 8px; color: #166534; font-size: 14px;"><strong>S3 Bucket:</strong> ${safeBucket}</p>
                    <p style="margin: 0; color: #166534; font-size: 14px;"><strong>S3 Key:</strong> ${safeS3Key}</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; color: #718096; font-size: 13px;">
                File backup đã được lưu trữ an toàn trên Amazon S3.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f7fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. Email tự động - không trả lời.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private getErrorEmailTemplate(dateTime: string, error: string): string {
    const safeError = this.escapeHtml(error);
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ⚠️ Backup Thất Bại
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Database backup đã gặp lỗi. Vui lòng kiểm tra và xử lý ngay.
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef2f2; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px;"><strong>Thời gian:</strong> ${dateTime}</p>
                    <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Lỗi:</strong></p>
                    <div style="background-color: #ffffff; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin-top: 8px;">
                      <code style="font-size: 13px; color: #dc2626; word-break: break-all; font-family: 'Courier New', monospace;">
                        ${safeError}
                      </code>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; color: #718096; font-size: 13px;">
                Vui lòng kiểm tra server và chạy backup thủ công nếu cần.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f7fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. Email tự động - không trả lời.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
  }
}
