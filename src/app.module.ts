import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma.module';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';
import { StoreModule } from './modules/store/store.module';
import { HealthController } from './common/controllers/health.controller';
// Import other modules as they are created
// import { AuthModule } from './modules/auth/auth.module';
// import { UserModule } from './modules/user/user.module';
// import { CategoryModule } from './modules/category/category.module';
// import { StoreModule } from './modules/store/store.module';
// import { CartModule } from './modules/cart/cart.module';
// import { OrderModule } from './modules/order/order.module';
// import { PaymentModule } from './modules/payment/payment.module';
// import { ShippingModule } from './modules/shipping/shipping.module';
// import { ReviewModule } from './modules/review/review.module';
// import { ChatModule } from './modules/chat/chat.module';
// import { InventoryModule } from './modules/inventory/inventory.module';
// import { BoostModule } from './modules/boost/boost.module';
// import { NotificationModule } from './modules/notification/notification.module';
// import { UploadModule } from './modules/upload/upload.module';
// import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CategoryModule,
    StoreModule,
    ProductModule,
    // Add other modules here
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}

