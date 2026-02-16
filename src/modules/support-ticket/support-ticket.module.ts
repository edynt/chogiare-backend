import { Module } from '@nestjs/common';
import { SupportTicketController } from './interfaces/controllers/support-ticket.controller';
import { SupportTicketService } from './application/services/support-ticket.service';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SupportTicketController],
  providers: [SupportTicketService],
  exports: [SupportTicketService],
})
export class SupportTicketModule {}
