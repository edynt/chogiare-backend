import { Order, OrderItem, OrderStatus, PaymentStatus } from '../entities/order.entity';

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';

export interface IOrderRepository {
  findById(id: number): Promise<Order | null>;
  findByUserId(userId: number, options?: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    skip?: number;
    take?: number;
  }): Promise<Order[]>;
  findByStoreId(storeId: number, options?: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    skip?: number;
    take?: number;
  }): Promise<Order[]>;
  create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  update(id: number, data: Partial<Order>): Promise<Order>;
  updateStatus(id: number, status: OrderStatus): Promise<Order>;
  updatePaymentStatus(id: number, paymentStatus: PaymentStatus): Promise<Order>;
  count(options?: {
    userId?: number;
    storeId?: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
  }): Promise<number>;
}

