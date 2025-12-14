export enum ShippingStatus {
  PENDING = 'pending',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
}

export class Shipping {
  id: number;
  orderId: number;
  trackingNumber?: string;
  carrier?: string;
  status: ShippingStatus;
  currentLocation?: string;
  estimatedDelivery?: bigint;
  shippingMetadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}

export class ShippingHistory {
  id: number;
  shippingId: number;
  status: string;
  location?: string;
  description?: string;
  timestamp: bigint;
  metadata: Record<string, unknown>;
}


