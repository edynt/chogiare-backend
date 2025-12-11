import { Module } from '@nestjs/common';
import { BoostController } from './interfaces/controllers/boost.controller';
import { BoostService } from './application/services/boost.service';
import { PaymentModule } from '@modules/payment/payment.module';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule, PaymentModule],
  controllers: [BoostController],
  providers: [BoostService],
  exports: [BoostService],
})
export class BoostModule {}
