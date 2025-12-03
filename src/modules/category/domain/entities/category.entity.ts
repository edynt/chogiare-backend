export class Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  productCount: number;
  isActive: boolean;
  createdAt: bigint;
  parent?: Category;
  children?: Category[];
}

