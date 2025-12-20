import { Module } from '@nestjs/common';
import { NotificationController } from './interfaces/controllers/notification.controller';
import { AdminNotificationController } from './interfaces/controllers/admin-notification.controller';
import { NotificationService } from './application/services/notification.service';
import { NotificationRepository } from './infrastructure/repositories/notification.repository';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository.interface';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationController, AdminNotificationController],
  providers: [
    NotificationService,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationRepository,
    },
  ],
  exports: [NotificationService, NOTIFICATION_REPOSITORY],
})
export class NotificationModule {}


