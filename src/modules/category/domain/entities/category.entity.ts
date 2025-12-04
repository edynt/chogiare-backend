export class Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  productCount: number;
  isActive: boolean;
  createdAt: bigint;
  parent?: Category;
  children?: Category[];
}

