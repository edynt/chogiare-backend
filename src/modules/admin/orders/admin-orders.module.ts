import { Module } from '@nestjs/common';
import { DatabaseModule } from '@common/database/database.module';
import { AdminOrderService } from './application/services/admin-order.service';
import { AdminOrderController } from './interfaces/controllers/admin-order.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminOrderController],
  providers: [AdminOrderService],
  exports: [AdminOrderService],
})
export class AdminOrdersModule {}
