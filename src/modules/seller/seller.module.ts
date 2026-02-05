import { Module } from '@nestjs/common';
import { SellerCustomerController } from './interfaces/controllers/seller-customer.controller';
import { SellerDashboardController } from './interfaces/controllers/seller-dashboard.controller';
import { SellerCustomerService } from './application/services/seller-customer.service';
import { SellerDashboardService } from './application/services/seller-dashboard.service';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SellerCustomerController, SellerDashboardController],
  providers: [SellerCustomerService, SellerDashboardService],
  exports: [SellerCustomerService, SellerDashboardService],
})
export class SellerModule {}
