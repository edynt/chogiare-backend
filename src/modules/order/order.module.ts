import { Module } from '@nestjs/common';
import { OrderService } from './application/services/order.service';
import { OrderController } from './interfaces/controllers/order.controller';
import { OrderRepository } from './infrastructure/repositories/order.repository';
import {
  ORDER_REPOSITORY,
  IOrderRepository,
} from './domain/repositories/order.repository.interface';
import { DatabaseModule } from '@common/database/database.module';
import { LoggerModule } from '@common/logger/logger.module';

@Module({
  imports: [DatabaseModule, LoggerModule],
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

