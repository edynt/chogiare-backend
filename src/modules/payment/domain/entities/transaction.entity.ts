export class Transaction {
  id: number;
  userId: number;
  type: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  reference: string | null;
  description: string | null;
  orderId: number | null;
  transactionMetadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}
