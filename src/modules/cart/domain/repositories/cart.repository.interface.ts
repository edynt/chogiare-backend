import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';

export const CART_REPOSITORY = Symbol('CART_REPOSITORY');

export interface ICartRepository {
  findByUserId(userId: number): Promise<Cart | null>;
  create(userId: number): Promise<Cart>;
  findCartItemByProductId(cartId: number, productId: number): Promise<CartItem | null>;
  addCartItem(data: {
    cartId: number;
    productId: number;
    quantity: number;
    price: number;
  }): Promise<CartItem>;
  updateCartItem(id: number, quantity: number, price: number): Promise<CartItem>;
  removeCartItem(id: number): Promise<void>;
  findCartItemsByCartId(cartId: number): Promise<CartItem[]>;
  clearCart(cartId: number): Promise<void>;
}
