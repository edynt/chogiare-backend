import { Module } from '@nestjs/common';
import { DatabaseModule } from '@common/database/database.module';
import { AdminTicketService } from './application/services/admin-ticket.service';
import { AdminTicketController } from './interfaces/controllers/admin-ticket.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminTicketController],
  providers: [AdminTicketService],
  exports: [AdminTicketService],
})
export class AdminTicketsModule {}
