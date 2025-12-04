import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import {
  ICartRepository,
  CART_REPOSITORY,
} from '../../domain/repositories/cart.repository.interface';
import { Cart, CartItem } from '../../domain/entities/cart.entity';

@Injectable()
export class CartRepository implements ICartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number): Promise<Cart | null> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    return cart ? this.toDomain(cart) : null;
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

    return this.toDomain(cart);
  }

  async addItem(
    cartId: number,
    productId: number,
    quantity: number,
    price: number,
  ): Promise<CartItem> {
    const now = BigInt(Date.now());
    const item = await this.prisma.cartItem.create({
      data: {
        cartId,
        productId,
        quantity,
        price,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Update cart updatedAt
    await this.prisma.cart.update({
      where: { id: cartId },
      data: { updatedAt: now },
    });

    return this.toDomainItem(item);
  }

  async updateItemQuantity(itemId: number, quantity: number): Promise<CartItem> {
    const now = BigInt(Date.now());
    const item = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        updatedAt: now,
      },
    });

    // Update cart updatedAt
    await this.prisma.cart.update({
      where: { id: item.cartId },
      data: { updatedAt: now },
    });

    return this.toDomainItem(item);
  }

  async removeItem(itemId: number): Promise<void> {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (item) {
      await this.prisma.cartItem.delete({
        where: { id: itemId },
      });

      // Update cart updatedAt
      await this.prisma.cart.update({
        where: { id: item.cartId },
        data: { updatedAt: BigInt(Date.now()) },
      });
    }
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

  async findItemById(itemId: number): Promise<CartItem | null> {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    return item ? this.toDomainItem(item) : null;
  }

  async findItemByCartAndProduct(
    cartId: number,
    productId: number,
  ): Promise<CartItem | null> {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
      },
    });

    return item ? this.toDomainItem(item) : null;
  }

  private toDomain(cart: any): Cart {
    return {
      id: cart.id,
      userId: cart.userId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  private toDomainItem(item: any): CartItem {
    return {
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price ? Number(item.price) : 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}

