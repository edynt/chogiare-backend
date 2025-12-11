import { Module } from '@nestjs/common';
import { PaymentController } from './interfaces/controllers/payment.controller';
import { PaymentService } from './application/services/payment.service';
import { PaymentRepository } from './infrastructure/repositories/payment.repository';
import { PAYMENT_REPOSITORY } from './domain/repositories/payment.repository.interface';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentRepository,
    },
  ],
  exports: [PaymentService, PAYMENT_REPOSITORY],
})
export class PaymentModule {}
