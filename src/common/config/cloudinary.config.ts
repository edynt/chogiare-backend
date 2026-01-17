import { registerAs } from '@nestjs/config';

export default registerAs('cloudinary', () => {
  const config = {
    name: process.env.CLOUDINARY_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    uploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER || '',
  };

  // Validate required Cloudinary configuration
  if (!config.name || !config.apiKey || !config.apiSecret || !config.uploadFolder) {
    throw new Error(
      'Missing required Cloudinary configuration. Please set CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, and CLOUDINARY_UPLOAD_FOLDER in .env file',
    );
  }

  return config;
});
