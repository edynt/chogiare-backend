import { Module } from '@nestjs/common';
import { ReportsController } from './interfaces/controllers/reports.controller';
import { ReportsService } from './application/services/reports.service';
import { OrderModule } from '@modules/order/order.module';
import { PrismaService } from '@common/database/prisma.service';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [OrderModule, DatabaseModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

