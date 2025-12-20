import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@common/config/config.module';
import { DatabaseModule } from '@common/database/database.module';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { HeaderValidationGuard } from '@common/guards/header-validation.guard';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { AuthModule } from '@modules/auth/auth.module';
import { CategoryModule } from '@modules/category/category.module';
import { ProductModule } from '@modules/product/product.module';
import { UploadModule } from '@modules/upload/upload.module';
import { CustomerModule } from '@modules/customer/customer.module';
import { PaymentModule } from '@modules/payment/payment.module';
import { BoostModule } from '@modules/boost/boost.module';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { ProductImportExportModule } from '@modules/product-import-export/product-import-export.module';
import { AdminModule } from '@modules/admin/admin.module';
import { ChatModule } from '@modules/chat/chat.module';
import { CartModule } from '@modules/cart/cart.module';
import { OrderModule } from '@modules/order/order.module';
import { CleanupModule } from '@modules/cleanup/cleanup.module';
import { StoreModule } from '@modules/store/store.module';
import { ReviewModule } from '@modules/review/review.module';
import { AddressModule } from '@modules/address/address.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { ShippingModule } from '@modules/shipping/shipping.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    CategoryModule,
    ProductModule,
    UploadModule,
    CustomerModule,
    PaymentModule,
    BoostModule,
    InventoryModule,
    ProductImportExportModule,
    AdminModule,
    ChatModule,
    CartModule,
    OrderModule,
    CleanupModule,
    StoreModule,
    ReviewModule,
    AddressModule,
    ReportsModule,
    NotificationModule,
    ShippingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: HeaderValidationGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
