import { Order, OrderItem, OrderStatus, PaymentStatus } from '../entities/order.entity';

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string, options?: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    skip?: number;
    take?: number;
  }): Promise<Order[]>;
  findByStoreId(storeId: string, options?: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    skip?: number;
    take?: number;
  }): Promise<Order[]>;
  create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  update(id: string, data: Partial<Order>): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order>;
  count(options?: {
    userId?: string;
    storeId?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
  }): Promise<number>;
}

