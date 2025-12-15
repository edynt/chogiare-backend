import { Module } from '@nestjs/common';
import { AdminOrdersModule } from './orders/admin-orders.module';
import { AdminProductsModule } from './products/admin-products.module';
import { AdminPaymentsModule } from './payments/admin-payments.module';

@Module({
  imports: [AdminOrdersModule, AdminProductsModule, AdminPaymentsModule],
  exports: [AdminOrdersModule, AdminProductsModule, AdminPaymentsModule],
})
export class AdminModule {}
