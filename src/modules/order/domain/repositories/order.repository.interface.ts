import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface IOrderRepository {
  create(data: {
    userId: number;
    storeId: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    currency: string;
    shippingAddressId: number | null;
    billingAddressId: number | null;
    notes: string | null;
    sellerNotes: string | null;
    orderMetadata: Record<string, unknown>;
  }): Promise<Order>;
  findById(id: number): Promise<Order | null>;
  findByUserId(
    userId: number,
    options?: {
      status?: string;
      paymentStatus?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: Order[]; total: number }>;
  findByStoreId(
    storeId: number,
    options?: {
      status?: string;
      paymentStatus?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: Order[]; total: number }>;
  updateStatus(id: number, status: string): Promise<Order>;
  updatePaymentStatus(id: number, paymentStatus: string): Promise<Order>;
  update(id: number, data: Partial<Order>): Promise<Order>;
  createOrderItem(data: {
    orderId: number;
    productId: number;
    productName: string;
    productImage: string | null;
    price: number;
    quantity: number;
    subtotal: number;
    itemMetadata: Record<string, unknown>;
  }): Promise<OrderItem>;
}
