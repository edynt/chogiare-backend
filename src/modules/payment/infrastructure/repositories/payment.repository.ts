import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { IPaymentRepository } from '@modules/payment/domain/repositories/payment.repository.interface';
import { Transaction } from '@modules/payment/domain/entities/transaction.entity';
import { UserBalance } from '@modules/payment/domain/entities/user-balance.entity';
import { DepositPackage } from '@modules/payment/domain/entities/deposit-package.entity';
import {
  Transaction as PrismaTransaction,
  Prisma,
  UserBalance as PrismaUserBalance,
  DepositPackage as PrismaDepositPackage,
} from '@prisma/client';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTransaction(transaction: Partial<Transaction>): Promise<Transaction> {
    const typeNum = typeof transaction.type === 'string' ? parseInt(transaction.type, 10) : transaction.type;
    const created = await this.prisma.transaction.create({
      data: {
        userId: transaction.userId!,
        type: typeNum!,
        amount: transaction.amount!,
        currency: transaction.currency || 'VND',
        status: transaction.status || 'pending',
        paymentMethod: transaction.paymentMethod,
        reference: transaction.reference || null,
        description: transaction.description || null,
        orderId: transaction.orderId || null,
        transactionMetadata: (transaction.transactionMetadata as object) || {},
        createdAt: transaction.createdAt || BigInt(Date.now()),
        updatedAt: transaction.updatedAt || BigInt(Date.now()),
      },
    });
    return this.toDomainTransaction(created);
  }

  async findTransactionById(id: number): Promise<Transaction | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });
    return transaction ? this.toDomainTransaction(transaction) : null;
  }

  async findTransactionsByUserId(
    userId: number,
    options?: {
      type?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: Transaction[]; total: number }> {
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    if (options?.type) {
      const typeNum = typeof options.type === 'string' ? parseInt(options.type, 10) : options.type;
      where.type = typeNum;
    }

    if (options?.status) {
      where.status = options.status;
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: transactions.map((t) => this.toDomainTransaction(t)),
      total,
    };
  }

  async updateTransactionStatus(id: number, status: string): Promise<Transaction> {
    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        status,
        updatedAt: BigInt(Date.now()),
      },
    });
    return this.toDomainTransaction(updated);
  }

  async getUserBalance(userId: number): Promise<UserBalance | null> {
    const balance = await this.prisma.userBalance.findUnique({
      where: { userId },
    });
    return balance ? this.toDomainBalance(balance) : null;
  }

  async createUserBalance(userId: number, initialBalance = 0): Promise<UserBalance> {
    const balance = await this.prisma.userBalance.create({
      data: {
        userId,
        balance: initialBalance,
        updatedAt: BigInt(Date.now()),
      },
    });
    return this.toDomainBalance(balance);
  }

  async updateBalance(
    userId: number,
    amount: number,
    operation: 'add' | 'subtract',
  ): Promise<UserBalance> {
    const currentBalance = await this.getUserBalance(userId);
    if (!currentBalance) {
      throw new Error('User balance not found');
    }

    const newBalance =
      operation === 'add'
        ? Number(currentBalance.balance) + amount
        : Number(currentBalance.balance) - amount;

    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }

    const updated = await this.prisma.userBalance.update({
      where: { userId },
      data: {
        balance: newBalance,
        updatedAt: BigInt(Date.now()),
      },
    });
    return this.toDomainBalance(updated);
  }

  async checkBalance(userId: number, amount: number): Promise<boolean> {
    const balance = await this.getUserBalance(userId);
    if (!balance) {
      return false;
    }
    return Number(balance.balance) >= amount;
  }

  private toDomainTransaction(prismaTransaction: PrismaTransaction): Transaction {
    return {
      id: prismaTransaction.id,
      userId: prismaTransaction.userId,
      type: prismaTransaction.type,
      amount: Number(prismaTransaction.amount),
      currency: prismaTransaction.currency,
      status: prismaTransaction.status,
      paymentMethod: prismaTransaction.paymentMethod,
      reference: prismaTransaction.reference,
      description: prismaTransaction.description,
      orderId: prismaTransaction.orderId,
      transactionMetadata: prismaTransaction.transactionMetadata as Record<string, unknown>,
      createdAt: prismaTransaction.createdAt,
      updatedAt: prismaTransaction.updatedAt,
    };
  }

  private toDomainBalance(balance: PrismaUserBalance): UserBalance {
    return {
      id: balance.id,
      userId: balance.userId,
      balance: Number(balance.balance),
      updatedAt: balance.updatedAt,
    };
  }

  async findActiveDepositPackages(): Promise<DepositPackage[]> {
    const packages = await this.prisma.depositPackage.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    return packages.map((pkg) => this.toDomainDepositPackage(pkg));
  }

  private toDomainDepositPackage(pkg: PrismaDepositPackage): DepositPackage {
    return {
      id: pkg.id,
      name: pkg.name,
      amount: Number(pkg.amount),
      displayOrder: pkg.displayOrder,
      isActive: pkg.isActive,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    };
  }
}
