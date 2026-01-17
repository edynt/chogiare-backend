export interface UploadResult {
  url: string;
  key: string;
  fileName: string;
  size: number;
  mimeType: string;
}

export interface IStorageProvider {
  uploadFile(
    file: Express.Multer.File,
    path?: string,
    folder?: string,
    isImageOnly?: boolean,
  ): Promise<UploadResult>;

  uploadMultipleFiles(
    files: Express.Multer.File[],
    path?: string,
    folder?: string,
    isImageOnly?: boolean,
  ): Promise<UploadResult[]>;

  deleteFile(key: string): Promise<void>;

  deleteMultipleFiles(keys: string[]): Promise<void>;

  getFileInfo(key: string): Promise<UploadResult>;

  listFiles(prefix: string): Promise<UploadResult[]>;
}
