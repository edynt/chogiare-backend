import { Shipping, ShippingHistory, ShippingStatus } from '../entities/shipping.entity';

export const SHIPPING_REPOSITORY = 'SHIPPING_REPOSITORY';

export interface IShippingRepository {
  findByOrderId(orderId: number): Promise<Shipping | null>;
  findByTrackingNumber(trackingNumber: string): Promise<Shipping | null>;
  create(data: {
    orderId: number;
    trackingNumber?: string;
    carrier?: string;
    status: ShippingStatus;
    currentLocation?: string;
    estimatedDelivery?: bigint;
  }): Promise<Shipping>;
  update(id: number, data: Partial<Shipping>): Promise<Shipping>;
  addHistory(data: {
    shippingId: number;
    status: string;
    location?: string;
    description?: string;
  }): Promise<ShippingHistory>;
  getHistory(shippingId: number): Promise<ShippingHistory[]>;
}


