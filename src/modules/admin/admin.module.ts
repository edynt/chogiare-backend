import { Module } from '@nestjs/common';
import { AdminOrdersModule } from './orders/admin-orders.module';
import { AdminProductsModule } from './products/admin-products.module';
import { AdminPaymentsModule } from './payments/admin-payments.module';
import { AdminJobsModule } from './jobs/admin-jobs.module';

@Module({
  imports: [AdminOrdersModule, AdminProductsModule, AdminPaymentsModule, AdminJobsModule],
  exports: [AdminOrdersModule, AdminProductsModule, AdminPaymentsModule, AdminJobsModule],
})
export class AdminModule {}
