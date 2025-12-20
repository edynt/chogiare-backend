import { Module } from '@nestjs/common';
import { ShippingController } from './interfaces/controllers/shipping.controller';
import { ShippingService } from './application/services/shipping.service';
import { ShippingRepository } from './infrastructure/repositories/shipping.repository';
import { SHIPPING_REPOSITORY } from './domain/repositories/shipping.repository.interface';
import { PrismaService } from '@common/database/prisma.service';

@Module({
  controllers: [ShippingController],
  providers: [
    ShippingService,
    PrismaService,
    {
      provide: SHIPPING_REPOSITORY,
      useClass: ShippingRepository,
    },
  ],
  exports: [ShippingService],
})
export class ShippingModule {}
