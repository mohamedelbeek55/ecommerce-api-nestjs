import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { CartEntity } from '../domain/cart.entity';
import { ICartRepository } from '../domain/cart.repository.interface';

@Injectable()
export class PrismaCartRepository implements ICartRepository {
  private readonly cartInclude = {
    items: { include: { product: true } },
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string): Promise<CartEntity | null> {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: this.cartInclude,
    });
  }

  createForUser(userId: string): Promise<CartEntity> {
    return this.prisma.cart.create({
      data: { userId },
      include: this.cartInclude,
    });
  }

  async addItem(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<CartEntity> {
    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      create: { cartId, productId, quantity },
      update: { quantity: { increment: quantity } },
    });

    return this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: this.cartInclude,
    });
  }

  async updateItemQuantity(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<CartEntity> {
    await this.prisma.cartItem.update({
      where: { cartId_productId: { cartId, productId } },
      data: { quantity },
    });

    return this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: this.cartInclude,
    });
  }

  async removeItem(cartId: string, productId: string): Promise<CartEntity> {
    await this.prisma.cartItem.delete({
      where: { cartId_productId: { cartId, productId } },
    });

    return this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: this.cartInclude,
    });
  }

  async clear(cartId: string): Promise<CartEntity> {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });

    return this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: this.cartInclude,
    });
  }
}
