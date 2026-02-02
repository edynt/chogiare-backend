import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderWithRelations extends Order {
  seller: {
    id: number;
    email: string;
    fullName: string | null;
    sellerName: string | null;
    sellerSlug: string | null;
    sellerLogo: string | null;
    sellerIsVerified: boolean;
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
  buyer: {
    id: number;
    email: string;
    fullName: string | null;
  };
}

export interface IOrderRepository {
  create(data: {
    orderNo: string;
    buyerId: number;
    sellerId: number;
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
  findByBuyerId(
    buyerId: number,
    options?: {
      status?: string;
      paymentStatus?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: Order[]; total: number }>;
  findByBuyerIdWithRelations(
    buyerId: number,
    options?: {
      status?: string;
      paymentStatus?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: OrderWithRelations[]; total: number }>;
  findBySellerId(
    sellerId: number,
    options?: {
      status?: string;
      paymentStatus?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: Order[]; total: number }>;
  findBySellerIdWithRelations(
    sellerId: number,
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
