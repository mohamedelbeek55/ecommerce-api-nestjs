import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CartEntity } from './domain/cart.entity';
import { ICartRepository } from './domain/cart.repository.interface';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

function isPrismaErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

@Injectable()
export class CartService {
  constructor(private readonly cartRepository: ICartRepository) { }

  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    return this.toResponse(cart);
  }

  async addItem(
    userId: string,
    dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    try {
      const updatedCart = await this.cartRepository.addItem(
        cart.id,
        dto.productId,
        dto.quantity,
      );
      return this.toResponse(updatedCart);
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2003')) {
        throw new BadRequestException('Product not found');
      }
      throw error;
    }
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    try {
      const updatedCart = await this.cartRepository.updateItemQuantity(
        cart.id,
        productId,
        dto.quantity,
      );
      return this.toResponse(updatedCart);
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2025')) {
        throw new NotFoundException('Item not in cart');
      }
      throw error;
    }
  }

  async removeItem(
    userId: string,
    productId: string,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    try {
      const updatedCart = await this.cartRepository.removeItem(
        cart.id,
        productId,
      );
      return this.toResponse(updatedCart);
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2025')) {
        throw new NotFoundException('Item not in cart');
      }
      throw error;
    }
  }

  async clearCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    const clearedCart = await this.cartRepository.clear(cart.id);
    return this.toResponse(clearedCart);
  }

  private async getOrCreateCart(userId: string): Promise<CartEntity> {
    const cart = await this.cartRepository.findByUserId(userId);
    return cart ?? this.cartRepository.createForUser(userId);
  }

  private toResponse(cart: CartEntity): CartResponseDto {
    let total = new Prisma.Decimal(0);
    const items = cart.items.map((item) => {
      const subtotal = item.product.price.mul(item.quantity);
      total = total.add(subtotal);

      return {
        productId: item.productId,
        name: item.product.name,
        price: item.product.price.toString(),
        quantity: item.quantity,
        subtotal: subtotal.toString(),
      };
    });

    return {
      id: cart.id,
      items,
      total: total.toString(),
    };
  }
}