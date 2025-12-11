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
      boostId: null,
      transactionMetadata: {},
      createdAt: now,
      updatedAt: now,
    });

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

  async useBalanceForBoost(
    userId: number,
    amount: number,
    boostId: number,
    description?: string,
  ): Promise<number> {
    const hasBalance = await this.paymentRepository.checkBalance(userId, amount);
    if (!hasBalance) {
      throw new BadRequestException({
        message: MESSAGES.PAYMENT.INSUFFICIENT_BALANCE,
        errorCode: ERROR_CODES.PAYMENT_INSUFFICIENT_BALANCE,
      });
    }

    const now = BigInt(Date.now());

    let transactionId: number;

    await this.prisma.$transaction(async (tx) => {
      let userBalance = await tx.userBalance.findUnique({
        where: { userId },
      });

      if (!userBalance) {
        userBalance = await tx.userBalance.create({
          data: {
            userId,
            balance: 0,
            updatedAt: now,
          },
        });
      }

      const newBalance = Number(userBalance.balance) - amount;
      if (newBalance < 0) {
        throw new BadRequestException({
          message: MESSAGES.PAYMENT.INSUFFICIENT_BALANCE,
          errorCode: ERROR_CODES.PAYMENT_INSUFFICIENT_BALANCE,
        });
      }

      await tx.userBalance.update({
        where: { userId },
        data: {
          balance: newBalance,
          updatedAt: now,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'boost',
          amount,
          currency: 'VND',
          status: 'completed',
          paymentMethod: null,
          reference: null,
          description: description || `Boost product - Boost ID: ${boostId}`,
          orderId: null,
          boostId: boostId || null,
          transactionMetadata: {},
          createdAt: now,
          updatedAt: now,
        },
      });

      transactionId = transaction.id;
    });

    return transactionId!;
  }

  private async processPayment(transactionId: number, paymentMethod: string): Promise<void> {
    this.logger.log(
      `Processing payment for transaction ${transactionId} with method ${paymentMethod}`,
    );

    switch (paymentMethod) {
      case 'momo':
        return this.processMoMoPayment(transactionId);
      case 'zalopay':
        return this.processZaloPayPayment(transactionId);
      case 'stripe':
        return this.processStripePayment(transactionId);
      case 'paypal':
        return this.processPayPalPayment(transactionId);
      case 'bank_transfer':
        return this.processBankTransferPayment(transactionId);
      default:
        throw new BadRequestException({
          message: MESSAGES.PAYMENT.INVALID_PAYMENT_METHOD,
          errorCode: ERROR_CODES.PAYMENT_INVALID_PAYMENT_METHOD,
        });
    }
  }

  private async processMoMoPayment(transactionId: number): Promise<void> {
    this.logger.log(`Processing MoMo payment for transaction ${transactionId}`);
  }

  private async processZaloPayPayment(transactionId: number): Promise<void> {
    this.logger.log(`Processing ZaloPay payment for transaction ${transactionId}`);
  }

  private async processStripePayment(transactionId: number): Promise<void> {
    this.logger.log(`Processing Stripe payment for transaction ${transactionId}`);
  }

  private async processPayPalPayment(transactionId: number): Promise<void> {
    this.logger.log(`Processing PayPal payment for transaction ${transactionId}`);
  }

  private async processBankTransferPayment(transactionId: number): Promise<void> {
    this.logger.log(`Processing Bank Transfer payment for transaction ${transactionId}`);
  }
}
