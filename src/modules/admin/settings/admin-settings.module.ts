import { Module } from '@nestjs/common';
import { AdminSettingsController } from './interfaces/controllers/admin-settings.controller';
import { AdminSettingsService } from './application/services/admin-settings.service';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminSettingsController],
  providers: [AdminSettingsService],
  exports: [AdminSettingsService],
})
export class AdminSettingsModule {}
