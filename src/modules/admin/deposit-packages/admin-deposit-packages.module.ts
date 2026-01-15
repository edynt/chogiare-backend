import { Module } from '@nestjs/common';
import { AdminDepositPackagesController } from './interfaces/controllers/admin-deposit-packages.controller';
import { AdminDepositPackagesService } from './application/services/admin-deposit-packages.service';
import { DatabaseModule } from '../../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminDepositPackagesController],
  providers: [AdminDepositPackagesService],
  exports: [AdminDepositPackagesService],
})
export class AdminDepositPackagesModule {}
