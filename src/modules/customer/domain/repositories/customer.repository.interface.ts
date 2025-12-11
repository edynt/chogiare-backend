import { Customer } from '../entities/customer.entity';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface ICustomerRepository {
  findById(id: number): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findAll(options?: {
    search?: string;
    status?: boolean;
    isVerified?: boolean;
    role?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Customer[]; total: number }>;
  updateStatus(id: number, status: boolean): Promise<Customer>;
  exists(id: number): Promise<boolean>;
}
