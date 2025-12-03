import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  ICartRepository,
  CART_REPOSITORY,
} from '../../domain/repositories/cart.repository.interface';
import { Cart, CartItem } from '../../domain/entities/cart.entity';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { PrismaService } from '@common/database/prisma.service';
import { LoggerService } from '@common/logger/logger.service';
import { MESSAGES } from '@common/constants/messages.constants';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }

    // Load cart with items and product info
    const cartWithItems = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                status: true,
                stock: true,
                availableStock: true,
                images: {
                  where: { displayOrder: 0 },
                  take: 1,
                  select: { imageUrl: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return this.toDomain(cartWithItems);
  }

  async addItem(userId: string, addCartItemDto: AddCartItemDto): Promise<CartItem> {
    // Get or create cart
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }

    // Validate product
    const product = await this.prisma.product.findUnique({
      where: { id: addCartItemDto.productId },
    });

    if (!product) {
      throw new NotFoundException(MESSAGES.CART.PRODUCT_NOT_FOUND);
    }

    if (product.status !== 'active' || !product.isActive) {
      throw new BadRequestException(MESSAGES.CART.PRODUCT_NOT_AVAILABLE);
    }

    if (product.availableStock < addCartItemDto.quantity) {
      throw new BadRequestException(MESSAGES.CART.INSUFFICIENT_STOCK);
    }

    // Check if item already exists in cart
    const existingItem = await this.cartRepository.findItemByCartAndProduct(
      cart.id,
      addCartItemDto.productId,
    );

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + addCartItemDto.quantity;
      if (product.availableStock < newQuantity) {
        throw new BadRequestException(MESSAGES.CART.INSUFFICIENT_STOCK);
      }
      return this.cartRepository.updateItemQuantity(existingItem.id, newQuantity);
    }

    // Add new item
    return this.cartRepository.addItem(
      cart.id,
      addCartItemDto.productId,
      addCartItemDto.quantity,
      Number(product.price),
    );
  }

  async updateItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartItem> {
    // Verify item belongs to user's cart
    const item = await this.cartRepository.findItemById(itemId);
    if (!item) {
      throw new NotFoundException(MESSAGES.CART.ITEM_NOT_FOUND);
    }

    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart || cart.id !== item.cartId) {
      throw new NotFoundException(MESSAGES.CART.ITEM_NOT_FOUND);
    }

    // Validate product stock
    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product) {
      throw new NotFoundException(MESSAGES.CART.PRODUCT_NOT_FOUND);
    }

    if (product.availableStock < updateCartItemDto.quantity) {
      throw new BadRequestException(MESSAGES.CART.INSUFFICIENT_STOCK);
    }

    return this.cartRepository.updateItemQuantity(itemId, updateCartItemDto.quantity);
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    // Verify item belongs to user's cart
    const item = await this.cartRepository.findItemById(itemId);
    if (!item) {
      throw new NotFoundException(MESSAGES.CART.ITEM_NOT_FOUND);
    }

    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart || cart.id !== item.cartId) {
      throw new NotFoundException(MESSAGES.CART.ITEM_NOT_FOUND);
    }

    await this.cartRepository.removeItem(itemId);

    this.logger.log(`Cart item removed: ${itemId}`, 'CartService', {
      itemId,
      userId,
    });
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      return;
    }

    await this.cartRepository.clearCart(cart.id);
  }

  async getCartStats(userId: string): Promise<{
    totalItems: number;
    totalValue: number;
    uniqueProducts: number;
  }> {
    const cart = await this.getCart(userId);
    const items = cart.items || [];

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const uniqueProducts = items.length;

    return {
      totalItems,
      totalValue,
      uniqueProducts,
    };
  }

  private toDomain(cart: any): Cart {
    return {
      id: cart.id,
      userId: cart.userId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items: cart.items
        ? cart.items.map((item: any) => ({
            id: item.id,
            cartId: item.cartId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price ? Number(item.price) : 0,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            product: item.product
              ? {
                  id: item.product.id,
                  title: item.product.title,
                  imageUrl: item.product.images?.[0]?.imageUrl,
                  stock: item.product.stock,
                  availableStock: item.product.availableStock,
                  status: item.product.status,
                }
              : undefined,
          }))
        : [],
    };
  }
}

