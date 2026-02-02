import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { PRODUCT_STATUS } from '@common/constants/enum.constants';
import {
  ICartRepository,
  CART_REPOSITORY,
} from '@modules/cart/domain/repositories/cart.repository.interface';
import { AddToCartDto } from '../dto/add-to-cart.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    private readonly prisma: PrismaService,
  ) {}

  async addToCart(userId: number, addToCartDto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: addToCartDto.productId },
      include: {
        seller: true,
      },
    });

    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    if (product.status !== PRODUCT_STATUS.ACTIVE) {
      throw new BadRequestException({
        message: MESSAGES.CART.PRODUCT_NOT_AVAILABLE,
        errorCode: ERROR_CODES.CART_PRODUCT_NOT_AVAILABLE,
      });
    }

    if (product.availableStock < addToCartDto.quantity) {
      throw new BadRequestException({
        message: MESSAGES.CART.INSUFFICIENT_STOCK,
        errorCode: ERROR_CODES.CART_INSUFFICIENT_STOCK,
      });
    }

    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }

    const existingCartItem = await this.cartRepository.findCartItemByProductId(
      cart.id,
      addToCartDto.productId,
    );

    const price = product.sellingPrice ? Number(product.sellingPrice) : Number(product.price);

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + addToCartDto.quantity;
      if (product.availableStock < newQuantity) {
        throw new BadRequestException({
          message: MESSAGES.CART.INSUFFICIENT_STOCK,
          errorCode: ERROR_CODES.CART_INSUFFICIENT_STOCK,
        });
      }
      await this.cartRepository.updateCartItem(existingCartItem.id, newQuantity, price);
    } else {
      await this.cartRepository.addCartItem({
        cartId: cart.id,
        productId: addToCartDto.productId,
        quantity: addToCartDto.quantity,
        price,
      });
    }

    return {
      message: MESSAGES.CART.ITEM_ADDED,
    };
  }

  async getCart(userId: number) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      return {
        items: [],
        groups: [],
        totalItems: 0,
        totalAmount: 0,
      };
    }

    const cartItems = await this.cartRepository.findCartItemsByCartId(cart.id);

    if (cartItems.length === 0) {
      return {
        items: [],
        groups: [],
        totalItems: 0,
        totalAmount: 0,
      };
    }

    const productIds = cartItems.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        seller: {
          select: {
            id: true,
            sellerName: true,
            sellerSlug: true,
            sellerLogo: true,
            sellerIsVerified: true,
          },
        },
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = cartItems
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
          return null;
        }

        return {
          id: item.id,
          productId: product.id,
          productTitle: product.title,
          productImage: product.images[0]?.imageUrl || null,
          price: Number(item.price),
          quantity: item.quantity,
          subtotal: Number(item.price) * item.quantity,
          sellerId: product.sellerId,
          sellerName: product.seller?.sellerName || null,
          sellerSlug: product.seller?.sellerSlug || null,
          sellerLogo: product.seller?.sellerLogo || null,
          sellerIsVerified: product.seller?.sellerIsVerified || false,
        };
      })
      .filter((item) => item !== null);

    const groupsMap = new Map<
      number,
      {
        sellerId: number;
        sellerName: string | null;
        sellerSlug: string | null;
        sellerLogo: string | null;
        sellerIsVerified: boolean;
        items: typeof items;
        subtotal: number;
      }
    >();

    items.forEach((item) => {
      if (!item) return;

      const sellerId = item.sellerId || 0;
      if (!groupsMap.has(sellerId)) {
        groupsMap.set(sellerId, {
          sellerId,
          sellerName: item.sellerName,
          sellerSlug: item.sellerSlug,
          sellerLogo: item.sellerLogo,
          sellerIsVerified: item.sellerIsVerified,
          items: [],
          subtotal: 0,
        });
      }

      const group = groupsMap.get(sellerId);
      if (group) {
        group.items.push(item);
        group.subtotal += item.subtotal;
      }
    });

    const groups = Array.from(groupsMap.values());
    const totalItems = items.reduce((sum, item) => sum + (item?.quantity || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + (item?.subtotal || 0), 0);

    return {
      items,
      groups,
      totalItems,
      totalAmount,
    };
  }

  async updateCartItem(userId: number, cartItemId: number, updateCartItemDto: UpdateCartItemDto) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException({
        message: MESSAGES.CART.NOT_FOUND,
        errorCode: ERROR_CODES.CART_NOT_FOUND,
      });
    }

    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        product: true,
      },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      throw new NotFoundException({
        message: MESSAGES.CART.ITEM_NOT_FOUND,
        errorCode: ERROR_CODES.CART_ITEM_NOT_FOUND,
      });
    }

    if (cartItem.product.status !== PRODUCT_STATUS.ACTIVE) {
      throw new BadRequestException({
        message: MESSAGES.CART.PRODUCT_NOT_AVAILABLE,
        errorCode: ERROR_CODES.CART_PRODUCT_NOT_AVAILABLE,
      });
    }

    if (cartItem.product.availableStock < updateCartItemDto.quantity) {
      throw new BadRequestException({
        message: MESSAGES.CART.INSUFFICIENT_STOCK,
        errorCode: ERROR_CODES.CART_INSUFFICIENT_STOCK,
      });
    }

    const price = cartItem.product.sellingPrice
      ? Number(cartItem.product.sellingPrice)
      : Number(cartItem.product.price);

    await this.cartRepository.updateCartItem(cartItemId, updateCartItemDto.quantity, price);

    return {
      message: MESSAGES.CART.ITEM_UPDATED,
    };
  }

  async removeCartItem(userId: number, cartItemId: number) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException({
        message: MESSAGES.CART.NOT_FOUND,
        errorCode: ERROR_CODES.CART_NOT_FOUND,
      });
    }

    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      throw new NotFoundException({
        message: MESSAGES.CART.ITEM_NOT_FOUND,
        errorCode: ERROR_CODES.CART_ITEM_NOT_FOUND,
      });
    }

    await this.cartRepository.removeCartItem(cartItemId);

    return {
      message: MESSAGES.CART.ITEM_REMOVED,
    };
  }

  async clearCart(userId: number) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      return {
        message: MESSAGES.CART.CLEARED,
      };
    }

    await this.cartRepository.clearCart(cart.id);

    return {
      message: MESSAGES.CART.CLEARED,
    };
  }

  async getCartStats(userId: number) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      return {
        totalItems: 0,
        totalValue: 0,
        uniqueProducts: 0,
      };
    }

    const cartItems = await this.cartRepository.findCartItemsByCartId(cart.id);

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const uniqueProducts = cartItems.length;

    return {
      totalItems,
      totalValue: Math.round(totalValue * 100) / 100,
      uniqueProducts,
    };
  }
}
