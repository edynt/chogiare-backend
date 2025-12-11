import { Module } from '@nestjs/common';
import { DatabaseModule } from '@common/database/database.module';
import { PaymentModule } from '@modules/payment/payment.module';
import { AdminPaymentService } from './application/services/admin-payment.service';
import { AdminPaymentController } from './interfaces/controllers/admin-payment.controller';

@Module({
  imports: [DatabaseModule, PaymentModule],
  controllers: [AdminPaymentController],
  providers: [AdminPaymentService],
  exports: [AdminPaymentService],
})
export class AdminPaymentsModule {}
