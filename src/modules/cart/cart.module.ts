import { Module } from '@nestjs/common';
import { CartService } from './application/services/cart.service';
import { CartController } from './interfaces/controllers/cart.controller';
import { CartRepository } from './infrastructure/repositories/cart.repository';
import {
  CART_REPOSITORY,
  ICartRepository,
} from './domain/repositories/cart.repository.interface';
import { DatabaseModule } from '@common/database/database.module';
import { LoggerModule } from '@common/logger/logger.module';

@Module({
  imports: [DatabaseModule, LoggerModule],
  controllers: [CartController],
  providers: [
    CartService,
    {
      provide: CART_REPOSITORY,
      useClass: CartRepository,
    },
  ],
  exports: [CartService, CART_REPOSITORY],
})
export class CartModule {}

