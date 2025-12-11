import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CartService } from '@modules/cart/application/services/cart.service';
import { AddToCartDto } from '@modules/cart/application/dto/add-to-cart.dto';
import { UpdateCartItemDto } from '@modules/cart/application/dto/update-cart-item.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add product to cart' })
  async addToCart(@CurrentUser('id') userId: number, @Body() addToCartDto: AddToCartDto) {
    return await this.cartService.addToCart(userId, addToCartDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get cart with items grouped by supplier' })
  async getCart(@CurrentUser('id') userId: number) {
    return await this.cartService.getCart(userId);
  }

  @Patch('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'id', type: Number })
  async updateCartItem(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) cartItemId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return await this.cartService.updateCartItem(userId, cartItemId, updateCartItemDto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'id', type: Number })
  async removeCartItem(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) cartItemId: number,
  ) {
    return await this.cartService.removeCartItem(userId, cartItemId);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Clear all items from cart' })
  async clearCart(@CurrentUser('id') userId: number) {
    return await this.cartService.clearCart(userId);
  }
}
