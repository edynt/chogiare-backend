import { Module } from '@nestjs/common';
import { ConfigModule } from '@common/config/config.module';
import { UploadController } from './interfaces/controllers/upload.controller';
import { UploadService } from './application/services/upload.service';
import { CloudinaryProvider } from './infrastructure/providers/cloudinary.provider';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [
    CloudinaryProvider,
    {
      provide: 'STORAGE_PROVIDER',
      useExisting: CloudinaryProvider,
    },
    UploadService,
  ],
  exports: [UploadService],
})
export class UploadModule {}
