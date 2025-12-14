import { Module } from '@nestjs/common';
import { ShippingController } from './interfaces/controllers/shipping.controller';
import { ShippingService } from './application/services/shipping.service';
import { ShippingRepository } from './infrastructure/repositories/shipping.repository';
import { SHIPPING_REPOSITORY } from './domain/repositories/shipping.repository.interface';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ShippingController],
  providers: [
    ShippingService,
    {
      provide: SHIPPING_REPOSITORY,
      useClass: ShippingRepository,
    },
  ],
  exports: [ShippingService, SHIPPING_REPOSITORY],
})
export class ShippingModule {}


