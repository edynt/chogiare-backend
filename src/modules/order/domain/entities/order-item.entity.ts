export class OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productImage: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  itemMetadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}
