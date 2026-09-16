import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CartEntity } from './domain/cart.entity';
import { ICartRepository } from './domain/cart.repository.interface';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: {
    findByUserId: jest.Mock;
    createForUser: jest.Mock;
    addItem: jest.Mock;
    updateItemQuantity: jest.Mock;
    removeItem: jest.Mock;
    clear: jest.Mock;
  };

  const cart: CartEntity = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        quantity: 3,
        product: {
          id: 'product-1',
          name: 'Premium coffee',
          price: new Prisma.Decimal('19.99'),
          stock: 10,
        },
      },
      {
        id: 'item-2',
        productId: 'product-2',
        quantity: 2,
        product: {
          id: 'product-2',
          name: 'Tea',
          price: new Prisma.Decimal('4.50'),
          stock: 20,
        },
      },
    ],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    cartRepository = {
      findByUserId: jest.fn().mockResolvedValue(cart),
      createForUser: jest.fn().mockResolvedValue(cart),
      addItem: jest.fn().mockResolvedValue(cart),
      updateItemQuantity: jest.fn().mockResolvedValue(cart),
      removeItem: jest.fn().mockResolvedValue(cart),
      clear: jest.fn().mockResolvedValue({ ...cart, items: [] }),
    };
    service = new CartService(
      cartRepository as unknown as ICartRepository,
    );
  });

  describe('getCart', () => {
    it('creates a cart when none exists and calculates decimal totals', async () => {
      cartRepository.findByUserId.mockResolvedValue(null);

      await expect(service.getCart(cart.userId)).resolves.toEqual({
        id: cart.id,
        items: [
          {
            productId: 'product-1',
            name: 'Premium coffee',
            price: '19.99',
            quantity: 3,
            subtotal: '59.97',
          },
          {
            productId: 'product-2',
            name: 'Tea',
            price: '4.5',
            quantity: 2,
            subtotal: '9',
          },
        ],
        total: '68.97',
      });
      expect(cartRepository.createForUser).toHaveBeenCalledWith(cart.userId);
    });
  });

  describe('addItem', () => {
    it('passes the cart item data to the repository', async () => {
      await service.addItem(cart.userId, {
        productId: 'product-3',
        quantity: 2,
      });

      expect(cartRepository.addItem).toHaveBeenCalledWith(
        cart.id,
        'product-3',
        2,
      );
    });

    it('translates a missing product error to BadRequestException', async () => {
      cartRepository.addItem.mockRejectedValue({ code: 'P2003' });

      await expect(
        service.addItem(cart.userId, {
          productId: 'missing-product',
          quantity: 1,
        }),
      ).rejects.toEqual(new BadRequestException('Product not found'));
    });
  });

  describe('updateItemQuantity', () => {
    it('passes the quantity update to the repository', async () => {
      await service.updateItemQuantity(cart.userId, 'product-1', {
        quantity: 5,
      });

      expect(cartRepository.updateItemQuantity).toHaveBeenCalledWith(
        cart.id,
        'product-1',
        5,
      );
    });

    it('translates a missing item error to NotFoundException', async () => {
      cartRepository.updateItemQuantity.mockRejectedValue({ code: 'P2025' });

      await expect(
        service.updateItemQuantity(cart.userId, 'missing-product', {
          quantity: 1,
        }),
      ).rejects.toEqual(new NotFoundException('Item not in cart'));
    });
  });

  describe('removeItem', () => {
    it('passes the item removal to the repository', async () => {
      await service.removeItem(cart.userId, 'product-1');

      expect(cartRepository.removeItem).toHaveBeenCalledWith(
        cart.id,
        'product-1',
      );
    });

    it('translates a missing item error to NotFoundException', async () => {
      cartRepository.removeItem.mockRejectedValue({ code: 'P2025' });

      await expect(
        service.removeItem(cart.userId, 'missing-product'),
      ).rejects.toEqual(new NotFoundException('Item not in cart'));
    });
  });

  describe('clearCart', () => {
    it('clears the cart and returns an empty response', async () => {
      await expect(service.clearCart(cart.userId)).resolves.toEqual({
        id: cart.id,
        items: [],
        total: '0',
      });
      expect(cartRepository.clear).toHaveBeenCalledWith(cart.id);
    });
  });
});
