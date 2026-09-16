import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CartEmptyError,
  InsufficientStockError,
  type OrderEntity,
} from '../domain/order.entity';
import { IOrderRepository } from '../domain/order.repository.interface';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  private readonly orderInclude = { items: true } as const;

  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string): Promise<OrderEntity> {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });

      if (!cart || cart.items.length === 0) {
        throw new CartEmptyError();
      }

      let total = new Prisma.Decimal(0);
      const items = [];

      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count !== 1) {
          throw new InsufficientStockError();
        }

        const subtotal = item.product.price.mul(item.quantity);
        total = total.add(subtotal);
        items.push({
          productId: item.productId,
          productName: item.product.name,
          unitPrice: item.product.price,
          quantity: item.quantity,
          subtotal,
        });
      }

      const order = await tx.order.create({
        data: {
          userId,
          total,
          items: { create: items },
        },
        include: this.orderInclude,
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return order;
    });
  }

  findAllByUserId(userId: string): Promise<OrderEntity[]> {
    return this.prisma.order.findMany({
      where: { userId },
      include: this.orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(userId: string, orderId: string): Promise<OrderEntity | null> {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: this.orderInclude,
    });
  }

  findByPaymentIntentId(
    paymentIntentId: string,
  ): Promise<OrderEntity | null> {
    return this.prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: this.orderInclude,
    });
  }

  async updateStatus(orderId: string, status: OrderEntity['status']): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  async updatePaymentIntentId(
    orderId: string,
    paymentIntentId: string,
  ): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentIntentId: paymentIntentId },
    });
  }

  async processPaymentEvent(
    eventId: string,
    paymentIntentId: string,
    status: OrderEntity['status'],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      try {
        await tx.processedStripeEvent.create({ data: { id: eventId } });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002') {
          return;
        }
        throw error;
      }

      await tx.order.updateMany({
        where: {
          stripePaymentIntentId: paymentIntentId,
          status: 'PENDING',
        },
        data: { status },
      });
    });
  }
}
