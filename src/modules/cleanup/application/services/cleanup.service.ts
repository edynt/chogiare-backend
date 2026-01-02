import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { promises as fs } from 'fs';
import { join } from 'path';
import { OrderStatus, PaymentStatus } from '@prisma/client';

const DAYS_TO_KEEP = 30;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  async cleanupOldLogs(): Promise<void> {
    try {
      const logsDirectory = join(process.cwd(), 'logs');
      const thirtyDaysAgo = Date.now() - DAYS_TO_KEEP * MILLISECONDS_PER_DAY;

      try {
        await fs.access(logsDirectory);
      } catch {
        this.logger.warn(`Logs directory does not exist: ${logsDirectory}`);
        return;
      }

      const files = await fs.readdir(logsDirectory);
      let deletedCount = 0;
      let totalSizeDeleted = 0;

      for (const file of files) {
        const filePath = join(logsDirectory, file);
        try {
          const stats = await fs.stat(filePath);
          if (stats.isFile() && stats.mtimeMs < thirtyDaysAgo) {
            totalSizeDeleted += stats.size;
            await fs.unlink(filePath);
            deletedCount++;
          }
        } catch (error) {
          this.logger.warn(
            `Failed to delete log file ${file}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      if (deletedCount > 0) {
        this.logger.log(
          `Cleaned up ${deletedCount} log files older than ${DAYS_TO_KEEP} days (${(totalSizeDeleted / 1024 / 1024).toFixed(2)} MB)`,
        );
      } else {
        this.logger.log('No old log files to clean up');
      }
    } catch (error) {
      this.logger.error(
        'Error cleaning up old logs',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async cleanupOldCarts(): Promise<void> {
    try {
      const thirtyDaysAgo = BigInt(Date.now() - DAYS_TO_KEEP * MILLISECONDS_PER_DAY);

      const oldCarts = await this.prisma.cart.findMany({
        where: {
          updatedAt: {
            lt: thirtyDaysAgo,
          },
        },
        include: {
          items: true,
        },
      });

      if (oldCarts.length === 0) {
        this.logger.log('No old carts to clean up');
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        for (const cart of oldCarts) {
          if (cart.items.length > 0) {
            await tx.cartItem.deleteMany({
              where: {
                cartId: cart.id,
              },
            });
          }
        }

        await tx.cart.deleteMany({
          where: {
            updatedAt: {
              lt: thirtyDaysAgo,
            },
          },
        });
      });

      this.logger.log(`Cleaned up ${oldCarts.length} old carts (older than ${DAYS_TO_KEEP} days)`);
    } catch (error) {
      this.logger.error(
        'Error cleaning up old carts',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async cleanupOldOrders(): Promise<void> {
    try {
      const thirtyDaysAgo = BigInt(Date.now() - DAYS_TO_KEEP * MILLISECONDS_PER_DAY);

      const oldOrders = await this.prisma.order.findMany({
        where: {
          status: {
            in: [OrderStatus.cancelled],
          },
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
        include: {
          items: true,
          transactions: true,
        },
      });

      if (oldOrders.length === 0) {
        this.logger.log('No old cancelled orders to clean up');
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        for (const order of oldOrders) {
          if (order.transactions.length > 0) {
            await tx.transaction.deleteMany({
              where: {
                orderId: order.id,
              },
            });
          }

          if (order.items.length > 0) {
            await tx.orderItem.deleteMany({
              where: {
                orderId: order.id,
              },
            });
          }
        }

        await tx.order.deleteMany({
          where: {
            status: {
              in: [OrderStatus.cancelled],
            },
            createdAt: {
              lt: thirtyDaysAgo,
            },
          },
        });
      });

      this.logger.log(
        `Cleaned up ${oldOrders.length} old cancelled orders (older than ${DAYS_TO_KEEP} days)`,
      );
    } catch (error) {
      this.logger.error(
        'Error cleaning up old orders',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async cleanupRejectedOrders(): Promise<void> {
    try {
      const thirtyDaysAgo = BigInt(Date.now() - DAYS_TO_KEEP * MILLISECONDS_PER_DAY);

      const rejectedOrders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.pending,
          createdAt: {
            lt: thirtyDaysAgo,
          },
          paymentStatus: {
            in: [PaymentStatus.pending, PaymentStatus.failed],
          },
        },
        include: {
          items: true,
          transactions: true,
        },
      });

      if (rejectedOrders.length === 0) {
        this.logger.log('No old rejected/pending orders to clean up');
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        for (const order of rejectedOrders) {
          if (order.transactions.length > 0) {
            await tx.transaction.deleteMany({
              where: {
                orderId: order.id,
              },
            });
          }

          if (order.items.length > 0) {
            await tx.orderItem.deleteMany({
              where: {
                orderId: order.id,
              },
            });
          }
        }

        await tx.order.deleteMany({
          where: {
            status: OrderStatus.pending,
            createdAt: {
              lt: thirtyDaysAgo,
            },
            paymentStatus: {
              in: [PaymentStatus.pending, PaymentStatus.failed],
            },
          },
        });
      });

      this.logger.log(
        `Cleaned up ${rejectedOrders.length} old rejected/pending orders (older than ${DAYS_TO_KEEP} days)`,
      );
    } catch (error) {
      this.logger.error(
        'Error cleaning up rejected orders',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = BigInt(Date.now());

      const result = await this.prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} expired sessions`);
      } else {
        this.logger.log('No expired sessions to clean up');
      }
    } catch (error) {
      this.logger.error(
        'Error cleaning up expired sessions',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
