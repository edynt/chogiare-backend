import { Shipping, ShippingHistory, ShippingStatus } from '@prisma/client';

export const SHIPPING_REPOSITORY = Symbol('SHIPPING_REPOSITORY');

export interface ShippingWithHistory extends Shipping {
  history?: ShippingHistory[];
}

export interface CreateShippingData {
  orderId: number;
  trackingNumber?: string;
  carrier?: string;
  status?: ShippingStatus;
  currentLocation?: string;
  estimatedDelivery?: bigint;
}

export interface UpdateShippingData {
  trackingNumber?: string;
  carrier?: string;
  status?: ShippingStatus;
  currentLocation?: string;
  estimatedDelivery?: bigint;
}

export interface CreateHistoryData {
  status: string;
  location?: string;
  description?: string;
  timestamp: bigint;
}

export interface IShippingRepository {
  findByOrderId(orderId: number): Promise<ShippingWithHistory | null>;
  findByTrackingNumber(trackingNumber: string): Promise<ShippingWithHistory | null>;
  create(data: CreateShippingData): Promise<Shipping>;
  update(id: number, data: UpdateShippingData): Promise<Shipping>;
  addHistory(shippingId: number, data: CreateHistoryData): Promise<ShippingHistory>;
  getHistory(shippingId: number): Promise<ShippingHistory[]>;
}
