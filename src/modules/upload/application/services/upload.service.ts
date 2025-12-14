import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  FILE_UPLOAD_PATHS,
  FileUploadPath,
} from '@common/constants/file.constants';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';

export interface UploadResult {
  url: string;
  key: string;
  fileName: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly cdnUrl: string;

  constructor(private readonly configService: ConfigService) {
    const s3Config = this.configService.get('s3');
    this.bucket = s3Config.bucket;
    this.cdnUrl = s3Config.cdnUrl;

    const clientConfig: {
      region: string;
      credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
      };
      endpoint?: string;
      forcePathStyle?: boolean;
    } = {
      region: s3Config.region,
    };

    if (s3Config.accessKeyId && s3Config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      };
    }

    if (s3Config.endpoint) {
      clientConfig.endpoint = s3Config.endpoint;
      clientConfig.forcePathStyle = s3Config.forcePathStyle || false;
    }

    this.s3Client = new S3Client(clientConfig);
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadPath?: FileUploadPath,
    folder?: string,
    isImageOnly = false,
  ): Promise<UploadResult> {
    this.validateFile(file);

    const allowedTypes = isImageOnly ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES;
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException({
        message: MESSAGES.UPLOAD.INVALID_FILE_TYPE,
        errorCode: ERROR_CODES.UPLOAD_INVALID_FILE_TYPE,
      });
    }

    const maxSize = isImageOnly ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      throw new BadRequestException({
        message: MESSAGES.UPLOAD.FILE_TOO_LARGE,
        errorCode: ERROR_CODES.UPLOAD_FILE_TOO_LARGE,
      });
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const uploadPathValue = uploadPath || FILE_UPLOAD_PATHS.DOCUMENTS;
    const folderPath = folder ? `${folder}/` : '';
    const key = `${uploadPathValue}/${folderPath}${fileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      });

      await this.s3Client.send(command);

      const url = this.cdnUrl ? `${this.cdnUrl}/${key}` : this.getS3Url(key);

      return {
        url,
        key,
        fileName,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error('S3 upload error', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException({
        message: MESSAGES.UPLOAD.UPLOAD_FAILED,
        errorCode: ERROR_CODES.UPLOAD_FAILED,
      });
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    uploadPath?: FileUploadPath,
    folder?: string,
    isImageOnly = false,
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file, uploadPath, folder, isImageOnly);
      results.push(result);
    }

    return results;
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error('S3 delete error', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException({
        message: MESSAGES.UPLOAD.DELETE_FAILED,
        errorCode: ERROR_CODES.UPLOAD_DELETE_FAILED,
      });
    }
  }

  async deleteMultipleFiles(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.deleteFile(key)));
  }

  async getFileInfo(key: string): Promise<UploadResult> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const url = this.cdnUrl ? `${this.cdnUrl}/${key}` : this.getS3Url(key);
      const fileName = key.split('/').pop() || key;

      return {
        url,
        key,
        fileName,
        size: response.ContentLength || 0,
        mimeType: response.ContentType || 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error('S3 get file info error', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException({
        message: MESSAGES.UPLOAD.FILE_NOT_FOUND || 'File not found',
        errorCode: ERROR_CODES.UPLOAD_FILE_NOT_FOUND || 'UPLOAD_FILE_NOT_FOUND',
      });
    }
  }

  async listFiles(prefix: string): Promise<UploadResult[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: 100,
      });

      const response = await this.s3Client.send(command);
      const files: UploadResult[] = [];

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key) {
            const url = this.cdnUrl ? `${this.cdnUrl}/${object.Key}` : this.getS3Url(object.Key);
            const fileName = object.Key.split('/').pop() || object.Key;

            files.push({
              url,
              key: object.Key,
              fileName,
              size: object.Size || 0,
              mimeType: 'application/octet-stream',
            });
          }
        }
      }

      return files;
    } catch (error) {
      this.logger.error('S3 list files error', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException({
        message: MESSAGES.UPLOAD.LIST_FAILED || 'Failed to list files',
        errorCode: ERROR_CODES.UPLOAD_LIST_FAILED || 'UPLOAD_LIST_FAILED',
      });
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException({
        message: MESSAGES.UPLOAD.FILE_REQUIRED,
        errorCode: ERROR_CODES.UPLOAD_FILE_REQUIRED,
      });
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException({
        message: MESSAGES.UPLOAD.INVALID_FILE,
        errorCode: ERROR_CODES.UPLOAD_INVALID_FILE,
      });
    }
  }

  private getS3Url(key: string): string {
    const s3Config = this.configService.get('s3');
    if (s3Config.endpoint) {
      return `${s3Config.endpoint}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
  }
}
