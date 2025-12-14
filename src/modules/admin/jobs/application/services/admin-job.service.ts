import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CleanupService } from '@modules/cleanup/application/services/cleanup.service';
import { UpdateJobScheduleDto } from '../dto/update-job-schedule.dto';

export interface JobInfo {
  name: string;
  description: string;
  cronExpression: string;
  isRunning: boolean;
  lastRun?: Date;
  nextRun?: Date;
  enabled: boolean;
}

@Injectable()
export class AdminJobService {
  private readonly logger = new Logger(AdminJobService.name);
  private readonly jobMetadata: Map<
    string,
    { description: string; lastRun?: Date; isRunning: boolean }
  > = new Map([
    ['logsCleanup', { description: 'Cleanup old log files', isRunning: false }],
    ['cartsCleanup', { description: 'Cleanup old abandoned carts', isRunning: false }],
    ['ordersCleanup', { description: 'Cleanup old cancelled orders', isRunning: false }],
    ['expiredSessionsCleanup', { description: 'Cleanup expired user sessions', isRunning: false }],
  ]);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly cleanupService: CleanupService,
  ) {}

  getAllJobs(): JobInfo[] {
    const jobs: JobInfo[] = [];
    const cronJobs = this.schedulerRegistry.getCronJobs();

    cronJobs.forEach((job, name) => {
      const metadata = this.jobMetadata.get(name) || { description: name, isRunning: false };
      const cronJob = job as CronJob;
      const cronTime = cronJob.cronTime;
      const cronExpression =
        typeof cronTime === 'string' ? cronTime : (cronTime as { source: string }).source;

      jobs.push({
        name,
        description: metadata.description,
        cronExpression,
        isRunning: metadata.isRunning,
        lastRun: metadata.lastRun,
        nextRun: this.getNextRunTime(cronExpression),
        enabled: true,
      });
    });

    return jobs;
  }

  getJob(name: string): JobInfo {
    const cronJobs = this.schedulerRegistry.getCronJobs();
    const job = cronJobs.get(name);

    if (!job) {
      throw new NotFoundException(`Job with name ${name} not found`);
    }

    const metadata = this.jobMetadata.get(name) || { description: name, isRunning: false };
    const cronJob = job as CronJob;
    const cronTime = cronJob.cronTime;
    const cronExpression =
      typeof cronTime === 'string' ? cronTime : (cronTime as { source: string }).source;

    return {
      name,
      description: metadata.description,
      cronExpression,
      isRunning: metadata.isRunning,
      lastRun: metadata.lastRun,
      nextRun: this.getNextRunTime(cronExpression),
      enabled: true,
    };
  }

  async updateJobSchedule(name: string, updateDto: UpdateJobScheduleDto): Promise<JobInfo> {
    const cronJobs = this.schedulerRegistry.getCronJobs();
    const existingJob = cronJobs.get(name);

    if (!existingJob) {
      throw new NotFoundException(`Job with name ${name} not found`);
    }

    this.schedulerRegistry.deleteCronJob(name);

    const newJob = new CronJob(updateDto.cronExpression, async () => {
      const metadata = this.jobMetadata.get(name);
      if (metadata) {
        metadata.isRunning = true;
        metadata.lastRun = new Date();
      }
      await this.executeJob(name);
      if (metadata) {
        metadata.isRunning = false;
      }
    });

    this.schedulerRegistry.addCronJob(name, newJob);
    newJob.start();

    this.logger.log(`Updated schedule for job ${name} to ${updateDto.cronExpression}`);

    return this.getJob(name);
  }

  async triggerJob(name: string): Promise<{ message: string; jobInfo: JobInfo }> {
    const cronJobs = this.schedulerRegistry.getCronJobs();
    const job = cronJobs.get(name);

    if (!job) {
      throw new NotFoundException(`Job with name ${name} not found`);
    }

    const metadata = this.jobMetadata.get(name);
    if (metadata?.isRunning) {
      throw new Error(`Job ${name} is already running`);
    }

    this.logger.log(`Manually triggering job ${name}`);

    if (metadata) {
      metadata.isRunning = true;
      metadata.lastRun = new Date();
    }

    try {
      await this.executeJob(name);
      this.logger.log(`Job ${name} completed successfully`);
    } catch (error) {
      this.logger.error(
        `Job ${name} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    } finally {
      if (metadata) {
        metadata.isRunning = false;
      }
    }

    return {
      message: `Job ${name} executed successfully`,
      jobInfo: this.getJob(name),
    };
  }

  private async executeJob(name: string): Promise<void> {
    switch (name) {
      case 'logsCleanup':
        await this.cleanupService.cleanupOldLogs();
        break;
      case 'cartsCleanup':
        await this.cleanupService.cleanupOldCarts();
        break;
      case 'ordersCleanup':
        await this.cleanupService.cleanupOldOrders();
        await this.cleanupService.cleanupRejectedOrders();
        break;
      case 'expiredSessionsCleanup':
        await this.cleanupService.cleanupExpiredSessions();
        break;
      default:
        throw new Error(`Unknown job: ${name}`);
    }
  }

  private getNextRunTime(cronExpression: string): Date | undefined {
    try {
      const cronJob = new CronJob(cronExpression, () => {});
      const nextDates = cronJob.nextDates(1);
      if (nextDates.length > 0) {
        const nextDate = nextDates[0];
        if (typeof nextDate.toJSDate === 'function') {
          return nextDate.toJSDate();
        }
        if (nextDate instanceof Date) {
          return nextDate;
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}
