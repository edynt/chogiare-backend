export class Product {
  id: number;
  sellerId: number;
  categoryId: number;
  title: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  condition: string;
  location: string | null;
  stock: number;
  minStock: number;
  maxStock: number | null;
  reservedStock: number;
  availableStock: number;
  costPrice: number | null;
  sellingPrice: number | null;
  profit: number | null;
  profitMargin: number | null;
  sku: string | null;
  barcode: string | null;
  status: string;
  rating: number;
  reviewCount: number;
  viewCount: number;
  salesCount: number;
  isFeatured: boolean;
  isPromoted: boolean;
  tags: string[];
  badges: string[];
  warranty: string | null;
  returnPolicy: string | null;
  inventoryInfo: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface ProductWithRelations extends Product {
  category: { id: number; name: string; slug: string } | null;
  images: Array<{ id: number; imageUrl: string; displayOrder: number }>;
}
