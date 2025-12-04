export class Cart {
  id: number;
  userId: number;
  createdAt: bigint;
  updatedAt: bigint;
  items?: CartItem[];
}

export class CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  price: number;
  createdAt: bigint;
  updatedAt: bigint;
  product?: {
    id: number;
    title: string;
    imageUrl?: string;
    stock: number;
    availableStock: number;
    status: string;
  };
}

