import { Cart, CartItem } from '../entities/cart.entity';

export const CART_REPOSITORY = 'CART_REPOSITORY';

export interface ICartRepository {
  findByUserId(userId: number): Promise<Cart | null>;
  create(userId: number): Promise<Cart>;
  addItem(cartId: number, productId: number, quantity: number, price: number): Promise<CartItem>;
  updateItemQuantity(itemId: number, quantity: number): Promise<CartItem>;
  removeItem(itemId: number): Promise<void>;
  clearCart(cartId: number): Promise<void>;
  findItemById(itemId: number): Promise<CartItem | null>;
  findItemByCartAndProduct(cartId: number, productId: number): Promise<CartItem | null>;
}

