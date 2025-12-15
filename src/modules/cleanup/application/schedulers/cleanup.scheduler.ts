import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CleanupService } from '../services/cleanup.service';

@Injectable()
export class CleanupScheduler {
  private readonly logger = new Logger(CleanupScheduler.name);

  constructor(private readonly cleanupService: CleanupService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleLogsCleanup() {
    this.logger.log('Starting scheduled cleanup of old logs');
    await this.cleanupService.cleanupOldLogs();
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCartsCleanup() {
    this.logger.log('Starting scheduled cleanup of old carts');
    await this.cleanupService.cleanupOldCarts();
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleOrdersCleanup() {
    this.logger.log('Starting scheduled cleanup of old orders');
    await this.cleanupService.cleanupOldOrders();
    await this.cleanupService.cleanupRejectedOrders();
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleExpiredSessionsCleanup() {
    this.logger.log('Starting scheduled cleanup of expired sessions');
    await this.cleanupService.cleanupExpiredSessions();
  }
}
