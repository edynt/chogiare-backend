import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CartService } from '../../application/services/cart.service';
import { AddCartItemDto } from '../../application/dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../../application/dto/update-cart-item.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Get('stats')
  getCartStats(@CurrentUser('id') userId: string) {
    return this.cartService.getCartStats(userId);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  addItem(
    @CurrentUser('id') userId: string,
    @Body() addCartItemDto: AddCartItemDto,
  ) {
    return this.cartService.addItem(userId, addCartItemDto);
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(userId, itemId, updateCartItemDto);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeItem(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(userId, itemId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }
}

