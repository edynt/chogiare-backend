import { Module } from '@nestjs/common';
import { AdminDashboardController } from './interfaces/controllers/admin-dashboard.controller';
import { AdminDashboardService } from './application/services/admin-dashboard.service';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
  exports: [AdminDashboardService],
})
export class AdminDashboardModule {}
