import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderWithRelations extends Order {
  store: {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    isVerified: boolean;
  };
  items: OrderItem[];
  shippingAddress: {
    id: number;
    street: string;
    ward: string | null;
    district: string | null;
    city: string;
    state: string;
  } | null;
  billingAddress: {
    id: number;
    street: string;
    ward: string | null;
    district: string | null;
    city: string;
    state: string;
  } | null;
  user: {
    id: number;
    email: string;
    userInfo: {
      fullName: string | null;
    } | null;
  };
}

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
  findByIdWithRelations(id: number): Promise<OrderWithRelations | null>;
  findByUserId(
    userId: number,
    options?: {
      status?: string;
      paymentStatus?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: Order[]; total: number }>;
  findByUserIdWithRelations(
    userId: number,
    options?: {
      status?: string;
      paymentStatus?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: OrderWithRelations[]; total: number }>;
  findByStoreId(
    storeId: number,
    options?: {
      status?: string;
      paymentStatus?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: Order[]; total: number }>;
  findByStoreIdWithRelations(
    storeId: number,
    options?: {
      status?: string;
      paymentStatus?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: OrderWithRelations[]; total: number }>;
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
