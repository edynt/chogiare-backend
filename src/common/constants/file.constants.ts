export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const FILE_UPLOAD_PATHS = {
  PRODUCTS: 'products',
  CHAT: 'chat',
  AVATARS: 'avatars',
  CATEGORIES: 'categories',
  STORES: 'stores',
  DOCUMENTS: 'documents',
} as const;

export type FileUploadPath = (typeof FILE_UPLOAD_PATHS)[keyof typeof FILE_UPLOAD_PATHS];
