import { Module } from '@nestjs/common';
import { OrderController } from './interfaces/controllers/order.controller';
import { OrderService } from './application/services/order.service';
import { OrderRepository } from './infrastructure/repositories/order.repository';
import { ORDER_REPOSITORY } from './domain/repositories/order.repository.interface';
import { DatabaseModule } from '@common/database/database.module';
import { CartModule } from '@modules/cart/cart.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { UploadModule } from '@modules/upload/upload.module';

@Module({
  imports: [DatabaseModule, CartModule, NotificationModule, UploadModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepository,
    },
  ],
  exports: [OrderService, ORDER_REPOSITORY],
})
export class OrderModule {}
