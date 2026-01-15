import { Module } from '@nestjs/common';
import { AdminOrdersModule } from './orders/admin-orders.module';
import { AdminProductsModule } from './products/admin-products.module';
import { AdminPaymentsModule } from './payments/admin-payments.module';
import { AdminDashboardModule } from './dashboard/admin-dashboard.module';
import { AdminAnalyticsModule } from './analytics/admin-analytics.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminSettingsModule } from './settings/admin-settings.module';
import { AdminPackagesModule } from './packages/admin-packages.module';
import { AdminDepositPackagesModule } from './deposit-packages/admin-deposit-packages.module';

@Module({
  imports: [
    AdminOrdersModule,
    AdminProductsModule,
    AdminPaymentsModule,
    AdminDashboardModule,
    AdminAnalyticsModule,
    AdminUsersModule,
    AdminSettingsModule,
    AdminPackagesModule,
    AdminDepositPackagesModule,
  ],
  exports: [
    AdminOrdersModule,
    AdminProductsModule,
    AdminPaymentsModule,
    AdminDashboardModule,
    AdminAnalyticsModule,
    AdminUsersModule,
    AdminSettingsModule,
    AdminPackagesModule,
    AdminDepositPackagesModule,
  ],
})
export class AdminModule {}
