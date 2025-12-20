import { Module } from '@nestjs/common';
import { AdminOrdersModule } from './orders/admin-orders.module';
import { AdminProductsModule } from './products/admin-products.module';
import { AdminPaymentsModule } from './payments/admin-payments.module';
import { AdminDashboardModule } from './dashboard/admin-dashboard.module';
import { AdminAnalyticsModule } from './analytics/admin-analytics.module';
import { AdminUsersModule } from './users/admin-users.module';

@Module({
  imports: [
    AdminOrdersModule,
    AdminProductsModule,
    AdminPaymentsModule,
    AdminDashboardModule,
    AdminAnalyticsModule,
    AdminUsersModule,
  ],
  exports: [
    AdminOrdersModule,
    AdminProductsModule,
    AdminPaymentsModule,
    AdminDashboardModule,
    AdminAnalyticsModule,
    AdminUsersModule,
  ],
})
export class AdminModule {}
