import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { ICartRepository } from '@modules/cart/domain/repositories/cart.repository.interface';
import { Cart } from '@modules/cart/domain/entities/cart.entity';
import { CartItem } from '@modules/cart/domain/entities/cart-item.entity';

@Injectable()
export class CartRepository implements ICartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number): Promise<Cart | null> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return null;
    }

    return this.toDomainCart(cart);
  }

  async create(userId: number): Promise<Cart> {
    const now = BigInt(Date.now());
    const cart = await this.prisma.cart.create({
      data: {
        userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.toDomainCart(cart);
  }

  async findCartItemByProductId(cartId: number, productId: number): Promise<CartItem | null> {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
      },
    });

    if (!cartItem) {
      return null;
    }

    return this.toDomainCartItem(cartItem);
  }

  async addCartItem(data: {
    cartId: number;
    productId: number;
    quantity: number;
    price: number;
  }): Promise<CartItem> {
    const now = BigInt(Date.now());
    const cartItem = await this.prisma.cartItem.create({
      data: {
        cartId: data.cartId,
        productId: data.productId,
        quantity: data.quantity,
        price: data.price,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.prisma.cart.update({
      where: { id: data.cartId },
      data: { updatedAt: now },
    });

    return this.toDomainCartItem(cartItem);
  }

  async updateCartItem(id: number, quantity: number, price: number): Promise<CartItem> {
    const cartItem = await this.prisma.cartItem.update({
      where: { id },
      data: {
        quantity,
        price,
        updatedAt: BigInt(Date.now()),
      },
    });

    const cart = await this.prisma.cart.findUnique({
      where: { id: cartItem.cartId },
    });

    if (cart) {
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { updatedAt: BigInt(Date.now()) },
      });
    }

    return this.toDomainCartItem(cartItem);
  }

  async removeCartItem(id: number): Promise<void> {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id },
    });

    if (cartItem) {
      await this.prisma.cartItem.delete({
        where: { id },
      });

      const cart = await this.prisma.cart.findUnique({
        where: { id: cartItem.cartId },
      });

      if (cart) {
        await this.prisma.cart.update({
          where: { id: cart.id },
          data: { updatedAt: BigInt(Date.now()) },
        });
      }
    }
  }

  async findCartItemsByCartId(cartId: number): Promise<CartItem[]> {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { cartId },
      orderBy: { createdAt: 'desc' },
    });

    return cartItems.map((item) => this.toDomainCartItem(item));
  }

  async clearCart(cartId: number): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });

    await this.prisma.cart.update({
      where: { id: cartId },
      data: { updatedAt: BigInt(Date.now()) },
    });
  }

  private toDomainCart(cart: {
    id: number;
    userId: number;
    createdAt: bigint;
    updatedAt: bigint;
  }): Cart {
    return {
      id: cart.id,
      userId: cart.userId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  private toDomainCartItem(cartItem: {
    id: number;
    cartId: number;
    productId: number;
    quantity: number;
    price: number | { toString(): string; toNumber(): number };
    createdAt: bigint;
    updatedAt: bigint;
  }): CartItem {
    return {
      id: cartItem.id,
      cartId: cartItem.cartId,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      price: typeof cartItem.price === 'number' ? cartItem.price : Number(cartItem.price),
      createdAt: cartItem.createdAt,
      updatedAt: cartItem.updatedAt,
    };
  }
}
