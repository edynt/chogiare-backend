export class Store {
  id: number;
  userId: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  logo?: string;
  banner?: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  followerCount: number;
  isVerified: boolean;
  isActive: boolean;
  contactInfo: Record<string, unknown>;
  addressInfo: Record<string, unknown>;
  businessInfo: Record<string, unknown>;
  businessHours: Record<string, unknown>;
  policies: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}
