import { Module } from '@nestjs/common';
import { DatabaseModule } from '@common/database/database.module';
import { AdminPackagesController } from './interfaces/controllers/admin-packages.controller';
import { AdminPackagesService } from './application/services/admin-packages.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminPackagesController],
  providers: [AdminPackagesService],
  exports: [AdminPackagesService],
})
export class AdminPackagesModule {}
