export class Review {
  id: number;
  productId: number;
  userId: number;
  orderId?: number;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean;
  helpfulCount: number;
  reviewMetadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}


