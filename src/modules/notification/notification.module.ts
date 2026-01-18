import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationController } from './interfaces/controllers/notification.controller';
import { AdminNotificationController } from './interfaces/controllers/admin-notification.controller';
import { NotificationGateway } from './interfaces/gateways/notification.gateway';
import { NotificationService } from './application/services/notification.service';
import { NotificationRepository } from './infrastructure/repositories/notification.repository';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository.interface';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [NotificationController, AdminNotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationRepository,
    },
  ],
  exports: [NotificationService, NotificationGateway, NOTIFICATION_REPOSITORY],
})
export class NotificationModule {}
