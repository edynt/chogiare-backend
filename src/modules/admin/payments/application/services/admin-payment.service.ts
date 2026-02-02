import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { PAYMENT_STATUS, TRANSACTION_TYPE } from '@common/constants/enum.constants';
import { isAdmin } from '@common/utils/admin.utils';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '@modules/payment/domain/repositories/payment.repository.interface';
import { QueryAdminPaymentDto } from '../dto/query-admin-payment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminPaymentService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getTransactions(adminId: number, queryDto: QueryAdminPaymentDto) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const where: Prisma.TransactionWhereInput = {};

    if (queryDto.userId) {
      where.userId = queryDto.userId;
    }

    if (queryDto.type) {
      where.type = queryDto.type;
    }

    if (queryDto.paymentMethod) {
      where.paymentMethod = queryDto.paymentMethod;
    }

    if (queryDto.status) {
      where.status = queryDto.status;
    }

    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          order: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      message: MESSAGES.ADMIN.PAYMENTS_RETRIEVED,
      data: {
        items: transactions.map((tx) => ({
          ...tx,
          amount: Number(tx.amount),
          createdAt: tx.createdAt.toString(),
          updatedAt: tx.updatedAt.toString(),
        })),
        total,
        page,
        pageSize,
      },
    };
  }

  async getTransactionById(adminId: number, transactionId: number) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
        order: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException({
        message: MESSAGES.ADMIN.PAYMENT_NOT_FOUND,
        errorCode: ERROR_CODES.ADMIN_PAYMENT_NOT_FOUND,
      });
    }

    return {
      message: MESSAGES.ADMIN.PAYMENTS_RETRIEVED,
      data: {
        ...transaction,
        amount: Number(transaction.amount),
        createdAt: transaction.createdAt.toString(),
        updatedAt: transaction.updatedAt.toString(),
      },
    };
  }

  async refundTransaction(adminId: number, transactionId: number, reason?: string) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException({
        message: MESSAGES.ADMIN.PAYMENT_NOT_FOUND,
        errorCode: ERROR_CODES.ADMIN_PAYMENT_NOT_FOUND,
      });
    }

    // Note: Transaction.status is String, not Int
    if (transaction.status === 'refunded') {
      throw new BadRequestException({
        message: MESSAGES.PAYMENT.PAYMENT_FAILED,
        errorCode: ERROR_CODES.PAYMENT_FAILED,
      });
    }

    if (transaction.status !== 'completed') {
      throw new BadRequestException({
        message: 'Only completed transactions can be refunded',
        errorCode: ERROR_CODES.PAYMENT_FAILED,
      });
    }

    const now = BigInt(Date.now());

    await this.prisma.$transaction(async () => {
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'refunded',
          updatedAt: now,
        },
      });

      await this.paymentRepository.updateBalance(
        transaction.userId,
        Number(transaction.amount),
        'add',
      );

      await this.prisma.transaction.create({
        data: {
          userId: transaction.userId,
          type: TRANSACTION_TYPE.REFUND,
          amount: transaction.amount,
          currency: transaction.currency,
          status: 'completed',
          paymentMethod: transaction.paymentMethod,
          reference: `REFUND-${transactionId}`,
          description: reason || `Refund for transaction ${transactionId}`,
          orderId: transaction.orderId,
          transactionMetadata: {
            originalTransactionId: transactionId,
            refundedBy: adminId,
            reason,
          },
          createdAt: now,
          updatedAt: now,
        },
      });
    });

    return {
      message: MESSAGES.ADMIN.PAYMENT_REFUNDED,
      data: { transactionId },
    };
  }

  async getPaymentStatistics(adminId: number) {
    const admin = await isAdmin(adminId, this.prisma);
    if (!admin) {
      throw new ForbiddenException({
        message: MESSAGES.USER.INSUFFICIENT_PERMISSIONS,
        errorCode: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      });
    }

    const [
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      totalRevenue,
      todayRevenue,
    ] = await Promise.all([
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { status: 'completed' } }),
      this.prisma.transaction.count({ where: { status: 'pending' } }),
      this.prisma.transaction.count({ where: { status: 'failed' } }),
      this.prisma.transaction.aggregate({
        where: { type: TRANSACTION_TYPE.SALE, status: 'completed' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          type: TRANSACTION_TYPE.SALE,
          status: 'completed',
          createdAt: {
            gte: BigInt(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      message: MESSAGES.ADMIN.PAYMENTS_RETRIEVED,
      data: {
        totalTransactions,
        completedTransactions,
        pendingTransactions,
        failedTransactions,
        totalRevenue: totalRevenue._sum?.amount ? Number(totalRevenue._sum.amount) : 0,
        todayRevenue: todayRevenue._sum?.amount ? Number(todayRevenue._sum.amount) : 0,
      },
    };
  }
}
