export class Cart {
  id: string;
  userId: string;
  createdAt: bigint;
  updatedAt: bigint;
  items?: CartItem[];
}

export class CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: bigint;
  updatedAt: bigint;
  product?: {
    id: string;
    title: string;
    imageUrl?: string;
    stock: number;
    availableStock: number;
    status: string;
  };
}

