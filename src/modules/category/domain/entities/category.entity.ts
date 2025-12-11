export class Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: number | null;
  productCount: number;
  isActive: boolean;
  displayOrder: number;
  metadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}
