export class Order {
  id: number;
  orderNo: string | null;
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
  createdAt: bigint;
  updatedAt: bigint;
}
