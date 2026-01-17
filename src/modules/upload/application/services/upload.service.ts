import { Injectable, Inject } from '@nestjs/common';
import { FileUploadPath } from '@common/constants/file.constants';
import {
  IStorageProvider,
  UploadResult,
} from '@modules/upload/infrastructure/providers/storage-provider.interface';

@Injectable()
export class UploadService {
  constructor(
    @Inject('STORAGE_PROVIDER')
    private readonly storageProvider: IStorageProvider,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    uploadPath?: FileUploadPath,
    folder?: string,
    isImageOnly = false,
  ): Promise<UploadResult> {
    return this.storageProvider.uploadFile(file, uploadPath, folder, isImageOnly);
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    uploadPath?: FileUploadPath,
    folder?: string,
    isImageOnly = false,
  ): Promise<UploadResult[]> {
    return this.storageProvider.uploadMultipleFiles(files, uploadPath, folder, isImageOnly);
  }

  async deleteFile(key: string): Promise<void> {
    return this.storageProvider.deleteFile(key);
  }

  async deleteMultipleFiles(keys: string[]): Promise<void> {
    return this.storageProvider.deleteMultipleFiles(keys);
  }

  async getFileInfo(key: string): Promise<UploadResult> {
    return this.storageProvider.getFileInfo(key);
  }

  async listFiles(prefix: string): Promise<UploadResult[]> {
    return this.storageProvider.listFiles(prefix);
  }
}
