import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CartEmptyError,
  InsufficientStockError,
  type OrderEntity,
} from './domain/order.entity';
import { IOrderRepository } from './domain/order.repository.interface';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: {
    checkout: jest.Mock;
    findAllByUserId: jest.Mock;
    findById: jest.Mock;
  };

  const order: OrderEntity = {
    id: 'order-1',
    userId: 'user-1',
    status: 'PENDING',
    total: new Prisma.Decimal('29.98'),
    items: [
      {
        id: 'order-item-1',
        productId: 'product-1',
        productName: 'Coffee',
        unitPrice: new Prisma.Decimal('14.99'),
        quantity: 2,
        subtotal: new Prisma.Decimal('29.98'),
      },
    ],
    createdAt: new Date('2026-09-14T00:00:00.000Z'),
    updatedAt: new Date('2026-09-14T00:00:00.000Z'),
  };

  beforeEach(() => {
    orderRepository = {
      checkout: jest.fn().mockResolvedValue(order),
      findAllByUserId: jest.fn().mockResolvedValue([order]),
      findById: jest.fn().mockResolvedValue(order),
    };
    service = new OrdersService(
      orderRepository as unknown as IOrderRepository,
    );
  });

  describe('checkout', () => {
    it('creates an order and maps decimal values to strings', async () => {
      await expect(service.checkout(order.userId)).resolves.toEqual({
        id: order.id,
        status: order.status,
        total: '29.98',
        items: [
          {
            productId: 'product-1',
            productName: 'Coffee',
            unitPrice: '14.99',
            quantity: 2,
            subtotal: '29.98',
          },
        ],
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
      expect(orderRepository.checkout).toHaveBeenCalledWith(order.userId);
    });

    it('translates an empty cart to BadRequestException', async () => {
      orderRepository.checkout.mockRejectedValue(new CartEmptyError());

      await expect(service.checkout(order.userId)).rejects.toEqual(
        new BadRequestException('Cart is empty'),
      );
    });

    it('translates insufficient stock to BadRequestException', async () => {
      orderRepository.checkout.mockRejectedValue(
        new InsufficientStockError(),
      );

      await expect(service.checkout(order.userId)).rejects.toEqual(
        new BadRequestException('Insufficient stock'),
      );
    });
  });

  describe('findAll', () => {
    it('returns the authenticated user orders', async () => {
      await expect(service.findAll(order.userId)).resolves.toHaveLength(1);
      expect(orderRepository.findAllByUserId).toHaveBeenCalledWith(
        order.userId,
      );
    });
  });

  describe('findById', () => {
    it('returns an order belonging to the authenticated user', async () => {
      await expect(
        service.findById(order.userId, order.id),
      ).resolves.toMatchObject({ id: order.id, total: '29.98' });
      expect(orderRepository.findById).toHaveBeenCalledWith(
        order.userId,
        order.id,
      );
    });

    it('throws NotFoundException when the order does not exist', async () => {
      orderRepository.findById.mockResolvedValue(null);

      await expect(
        service.findById(order.userId, 'missing-order'),
      ).rejects.toEqual(new NotFoundException('Order not found'));
    });
  });
});
