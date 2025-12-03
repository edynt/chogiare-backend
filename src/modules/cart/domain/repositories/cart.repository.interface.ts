import { Cart, CartItem } from '../entities/cart.entity';

export const CART_REPOSITORY = 'CART_REPOSITORY';

export interface ICartRepository {
  findByUserId(userId: string): Promise<Cart | null>;
  create(userId: string): Promise<Cart>;
  addItem(cartId: string, productId: string, quantity: number, price: number): Promise<CartItem>;
  updateItemQuantity(itemId: string, quantity: number): Promise<CartItem>;
  removeItem(itemId: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  findItemById(itemId: string): Promise<CartItem | null>;
  findItemByCartAndProduct(cartId: string, productId: string): Promise<CartItem | null>;
}

