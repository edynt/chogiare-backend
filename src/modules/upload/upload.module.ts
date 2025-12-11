import { Module } from '@nestjs/common';
import { ConfigModule } from '@common/config/config.module';
import { UploadController } from './interfaces/controllers/upload.controller';
import { UploadService } from './application/services/upload.service';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
