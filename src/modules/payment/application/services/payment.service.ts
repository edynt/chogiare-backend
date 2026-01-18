import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '@modules/payment/domain/repositories/payment.repository.interface';
import { DepositDto } from '../dto/deposit.dto';
import { QueryTransactionDto } from '../dto/query-transaction.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async deposit(userId: number, depositDto: DepositDto) {
    const now = BigInt(Date.now());

    const transaction = await this.paymentRepository.createTransaction({
      userId,
      type: 'deposit',
      amount: depositDto.amount,
      currency: 'VND',
      status: 'pending',
      paymentMethod: depositDto.paymentMethod,
      reference: depositDto.reference || null,
      description: depositDto.description || 'Deposit to wallet',
      orderId: null,
      transactionMetadata: {},
      createdAt: now,
      updatedAt: now,
    });

    // For bank_transfer, return pending transaction (user confirms later)
    if (depositDto.paymentMethod === 'bank_transfer') {
      let userBalance = await this.paymentRepository.getUserBalance(userId);
      if (!userBalance) {
        userBalance = await this.paymentRepository.createUserBalance(userId, 0);
      }

      return {
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          status: 'pending',
          paymentMethod: transaction.paymentMethod,
          createdAt: transaction.createdAt.toString(),
        },
        balance: {
          previousBalance: Number(userBalance.balance),
          newBalance: Number(userBalance.balance),
        },
      };
    }

    // For other payment methods, process immediately
    try {
      await this.processPayment(transaction.id, depositDto.paymentMethod);

      let userBalance = await this.paymentRepository.getUserBalance(userId);
      if (!userBalance) {
        userBalance = await this.paymentRepository.createUserBalance(userId, 0);
      }

      await this.paymentRepository.updateBalance(userId, depositDto.amount, 'add');

      await this.paymentRepository.updateTransactionStatus(transaction.id, 'completed');

      const updatedBalance = await this.paymentRepository.getUserBalance(userId);

      return {
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          status: 'completed',
          paymentMethod: transaction.paymentMethod,
          createdAt: transaction.createdAt.toString(),
        },
        balance: {
          previousBalance: Number(userBalance.balance),
          newBalance: updatedBalance ? Number(updatedBalance.balance) : depositDto.amount,
        },
      };
    } catch (error) {
      this.logger.error(
        'Payment processing error',
        error instanceof Error ? error.stack : undefined,
      );
      await this.paymentRepository.updateTransactionStatus(transaction.id, 'failed');
      throw new BadRequestException({
        message: MESSAGES.PAYMENT.PAYMENT_FAILED,
        errorCode: ERROR_CODES.PAYMENT_FAILED,
      });
    }
  }

  async confirmDeposit(userId: number, transactionId: number) {
    const transaction = await this.paymentRepository.findTransactionById(transactionId);

    if (!transaction) {
      throw new NotFoundException({
        message: MESSAGES.PAYMENT.TRANSACTION_NOT_FOUND,
        errorCode: ERROR_CODES.PAYMENT_TRANSACTION_NOT_FOUND,
      });
    }

    if (transaction.userId !== userId) {
      throw new BadRequestException({
        message: MESSAGES.PAYMENT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.PAYMENT_UNAUTHORIZED_ACCESS,
      });
    }

    if (transaction.type !== 'deposit') {
      throw new BadRequestException({
        message: 'Transaction is not a deposit',
        errorCode: ERROR_CODES.PAYMENT_INVALID_TRANSACTION,
      });
    }

    if (transaction.status !== 'pending') {
      throw new BadRequestException({
        message: 'Transaction is not pending',
        errorCode: ERROR_CODES.PAYMENT_INVALID_TRANSACTION,
      });
    }

    let userBalance = await this.paymentRepository.getUserBalance(userId);
    if (!userBalance) {
      userBalance = await this.paymentRepository.createUserBalance(userId, 0);
    }

    const previousBalance = Number(userBalance.balance);

    await this.paymentRepository.updateBalance(userId, transaction.amount, 'add');
    await this.paymentRepository.updateTransactionStatus(transactionId, 'completed');

    const updatedBalance = await this.paymentRepository.getUserBalance(userId);

    return {
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: 'completed',
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt.toString(),
      },
      balance: {
        previousBalance,
        newBalance: updatedBalance ? Number(updatedBalance.balance) : previousBalance + transaction.amount,
      },
    };
  }

  async getBalance(userId: number) {
    let balance = await this.paymentRepository.getUserBalance(userId);
    if (!balance) {
      balance = await this.paymentRepository.createUserBalance(userId, 0);
    }

    return {
      balance: Number(balance.balance),
      currency: 'VND',
      updatedAt: balance.updatedAt.toString(),
    };
  }

  async getTransactions(userId: number, queryDto: QueryTransactionDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;

    const result = await this.paymentRepository.findTransactionsByUserId(userId, {
      type: queryDto.type,
      status: queryDto.status,
      page,
      pageSize,
    });

    return {
      items: result.items.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        reference: transaction.reference,
        description: transaction.description,
        createdAt: transaction.createdAt.toString(),
        updatedAt: transaction.updatedAt.toString(),
      })),
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async getTransactionById(userId: number, transactionId: number) {
    const transaction = await this.paymentRepository.findTransactionById(transactionId);
    if (!transaction) {
      throw new NotFoundException({
        message: MESSAGES.PAYMENT.TRANSACTION_NOT_FOUND,
        errorCode: ERROR_CODES.PAYMENT_TRANSACTION_NOT_FOUND,
      });
    }

    if (transaction.userId !== userId) {
      throw new BadRequestException({
        message: MESSAGES.PAYMENT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.PAYMENT_UNAUTHORIZED_ACCESS,
      });
    }

    return {
      ...transaction,
      createdAt: transaction.createdAt.toString(),
      updatedAt: transaction.updatedAt.toString(),
    };
  }

  private async processPayment(transactionId: number, paymentMethod: string): Promise<void> {
    if (paymentMethod !== 'bank_transfer') {
      throw new BadRequestException({
        message: MESSAGES.PAYMENT.INVALID_PAYMENT_METHOD,
        errorCode: ERROR_CODES.PAYMENT_INVALID_PAYMENT_METHOD,
      });
    }
    this.logger.log(`Processing Bank Transfer payment for transaction ${transactionId}`);
    // Bank transfer processing logic (if any)
  }

  async getDepositPackages() {
    const packages = await this.paymentRepository.findActiveDepositPackages();
    return packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      amount: pkg.amount,
      displayOrder: pkg.displayOrder,
    }));
  }
}
