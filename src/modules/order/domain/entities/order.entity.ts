export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  READY_FOR_PICKUP = 'ready_for_pickup',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  MOMO = 'momo',
  ZALOPAY = 'zalopay',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
}

export class Order {
  id: string;
  userId: string;
  storeId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  shippingAddressId?: string;
  billingAddressId?: string;
  notes?: string;
  sellerNotes?: string;
  createdAt: bigint;
  updatedAt: bigint;
  items?: OrderItem[];
}

export class OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  subtotal: number;
  createdAt: bigint;
  updatedAt: bigint;
}

