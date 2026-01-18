import { Module } from '@nestjs/common';
import { SellerCustomerController } from './interfaces/controllers/seller-customer.controller';
import { SellerCustomerService } from './application/services/seller-customer.service';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SellerCustomerController],
  providers: [SellerCustomerService],
  exports: [SellerCustomerService],
})
export class SellerModule {}
