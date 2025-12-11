import { Module } from '@nestjs/common';
import { CartController } from './interfaces/controllers/cart.controller';
import { CartService } from './application/services/cart.service';
import { CartRepository } from './infrastructure/repositories/cart.repository';
import { CART_REPOSITORY } from './domain/repositories/cart.repository.interface';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
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
