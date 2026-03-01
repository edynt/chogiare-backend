import { Module } from '@nestjs/common';
import { PaymentController } from './interfaces/controllers/payment.controller';
import { SepayWebhookController } from './interfaces/controllers/sepay-webhook.controller';
import { PaymentService } from './application/services/payment.service';
import { SepayService } from './application/services/sepay.service';
import { PaymentRepository } from './infrastructure/repositories/payment.repository';
import { PAYMENT_REPOSITORY } from './domain/repositories/payment.repository.interface';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentController, SepayWebhookController],
  providers: [
    PaymentService,
    SepayService,
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentRepository,
    },
  ],
  exports: [PaymentService, SepayService, PAYMENT_REPOSITORY],
})
export class PaymentModule {}
