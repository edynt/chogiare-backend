import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@common/config/config.module';
import { DatabaseModule } from '@common/database/database.module';
import { SupabaseModule } from '@common/database/supabase.module';
import { LoggerModule } from '@common/logger/logger.module';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { HeaderValidationGuard } from '@common/guards/header-validation.guard';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { AuthModule } from '@modules/auth/auth.module';
import { CategoryModule } from '@modules/category/category.module';
import { AddressModule } from '@modules/address/address.module';
import { StoreModule } from '@modules/store/store.module';
import { ProductModule } from '@modules/product/product.module';
import { CartModule } from '@modules/cart/cart.module';
import { OrderModule } from '@modules/order/order.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    SupabaseModule,
    LoggerModule,
    AuthModule,
    CategoryModule,
    AddressModule,
    StoreModule,
    ProductModule,
    CartModule,
    OrderModule,
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

