import { Transaction } from '../entities/transaction.entity';
import { UserBalance } from '../entities/user-balance.entity';
import { DepositPackage } from '../entities/deposit-package.entity';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export interface IPaymentRepository {
  createTransaction(transaction: Partial<Transaction>): Promise<Transaction>;
  findTransactionById(id: number): Promise<Transaction | null>;
  findTransactionsByUserId(
    userId: number,
    options?: {
      type?: string | number;
      status?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: Transaction[]; total: number }>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction>;
  getUserBalance(userId: number): Promise<UserBalance | null>;
  createUserBalance(userId: number, initialBalance?: number): Promise<UserBalance>;
  updateBalance(
    userId: number,
    amount: number,
    operation: 'add' | 'subtract',
  ): Promise<UserBalance>;
  checkBalance(userId: number, amount: number): Promise<boolean>;
  findActiveDepositPackages(): Promise<DepositPackage[]>;
  /**
   * Atomically confirm a pending deposit: set status to 'completed' and increment user balance.
   * Returns true if the deposit was confirmed, false if already processed (idempotent).
   */
  completeDepositTransaction(transactionId: number, userId: number, amount: number): Promise<boolean>;
}
