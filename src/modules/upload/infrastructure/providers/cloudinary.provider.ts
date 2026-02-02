import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import pLimit from 'p-limit';
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
} from '@common/constants/file.constants';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { IStorageProvider, UploadResult } from './storage-provider.interface';

// Limit concurrent uploads to prevent connection saturation
const CONCURRENT_UPLOAD_LIMIT = 3;

@Injectable()
export class CloudinaryProvider implements IStorageProvider {
  private readonly logger = new Logger(CloudinaryProvider.name);
  private readonly uploadFolder: string;

  constructor(private readonly configService: ConfigService) {
    const cloudinaryConfig = this.configService.get('cloudinary');
    this.uploadFolder = cloudinaryConfig.uploadFolder;

    cloudinary.config({
      cloud_name: cloudinaryConfig.name,
      api_key: cloudinaryConfig.apiKey,
      api_secret: cloudinaryConfig.apiSecret,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadPath?: string,
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

    // Sanitize path inputs to prevent path traversal
    const uploadPathValue = (uploadPath || 'documents').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedFolder = folder ? folder.replace(/[^a-zA-Z0-9_-]/g, '_') : '';
    const cloudinaryFolder = `${this.uploadFolder}/${uploadPathValue}${sanitizedFolder ? `/${sanitizedFolder}` : ''}`;

    try {
      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: cloudinaryFolder,
            public_id: fileName.replace(fileExtension, ''),
            resource_type: 'auto',
            timeout: 60000, // 60 seconds timeout for Cloudinary
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as UploadApiResponse);
          },
        );

        // Handle stream errors
        uploadStream.on('error', (err) => {
          this.logger.error('Upload stream error', { error: err.message });
          reject(err);
        });

        uploadStream.end(file.buffer);
      });

      return {
        url: result.secure_url,
        key: result.public_id,
        fileName: fileName,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      // Handle EPIPE and connection errors gracefully
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as NodeJS.ErrnoException)?.code;

      this.logger.error('Cloudinary upload error', {
        fileName: fileName,
        mimeType: file.mimetype,
        size: file.size,
        error: errorMessage,
        errorCode: errorCode,
      });

      // Don't throw for EPIPE if upload actually succeeded (check by retrying getFileInfo)
      if (errorCode === 'EPIPE') {
        this.logger.warn(
          'EPIPE error occurred, this may indicate the upload succeeded but response was lost',
        );
      }

      throw new InternalServerErrorException({
        message: MESSAGES.UPLOAD.UPLOAD_FAILED,
        errorCode: ERROR_CODES.UPLOAD_FAILED,
      });
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    uploadPath?: string,
    folder?: string,
    isImageOnly = false,
  ): Promise<UploadResult[]> {
    // Limit concurrent uploads to prevent connection saturation and EPIPE errors
    const limit = pLimit(CONCURRENT_UPLOAD_LIMIT);

    const uploadPromises = files.map((file) =>
      limit(() =>
        this.uploadFile(file, uploadPath, folder, isImageOnly).catch((error) => {
          this.logger.error('Failed to upload file', {
            fileName: file.originalname,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }),
      ),
    );

    return Promise.all(uploadPromises);
  }

  async deleteFile(key: string): Promise<void> {
    try {
      // Sanitize key to prevent injection
      const sanitizedKey = key.replace(/[^\w\/-]/g, '');
      await cloudinary.uploader.destroy(sanitizedKey);
    } catch (error) {
      this.logger.error('Cloudinary delete error', {
        key: key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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
      // Sanitize key to prevent injection
      const sanitizedKey = key.replace(/[^\w\/-]/g, '');
      const result = await cloudinary.api.resource(sanitizedKey);

      return {
        url: result.secure_url,
        key: result.public_id,
        fileName: result.public_id.split('/').pop() || key,
        size: result.bytes,
        mimeType:
          result.resource_type === 'image' ? `image/${result.format}` : 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error('Cloudinary get file info error', {
        key: key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new InternalServerErrorException({
        message: MESSAGES.UPLOAD.FILE_NOT_FOUND || 'File not found',
        errorCode: ERROR_CODES.UPLOAD_FILE_NOT_FOUND || 'UPLOAD_FILE_NOT_FOUND',
      });
    }
  }

  async listFiles(prefix: string): Promise<UploadResult[]> {
    try {
      // Sanitize prefix to prevent injection
      const sanitizedPrefix = prefix.replace(/[^a-zA-Z0-9_\/-]/g, '_');
      const folderPath = `${this.uploadFolder}/${sanitizedPrefix}`;
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath,
        max_results: 100,
      });

      const files: UploadResult[] = result.resources.map(
        (resource: {
          secure_url: string;
          public_id: string;
          bytes: number;
          resource_type: string;
          format: string;
        }) => ({
          url: resource.secure_url,
          key: resource.public_id,
          fileName: resource.public_id.split('/').pop() || resource.public_id,
          size: resource.bytes,
          mimeType:
            resource.resource_type === 'image'
              ? `image/${resource.format}`
              : 'application/octet-stream',
        }),
      );

      return files;
    } catch (error) {
      this.logger.error('Cloudinary list files error', {
        prefix: prefix,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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
}
