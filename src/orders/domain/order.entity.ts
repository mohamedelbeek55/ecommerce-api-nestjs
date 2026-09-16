import { Prisma } from '@prisma/client';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface OrderItemEntity {
  id: string;
  productId: string;
  productName: string;
  unitPrice: Prisma.Decimal;
  quantity: number;
  subtotal: Prisma.Decimal;
}

export interface OrderEntity {
  id: string;
  userId: string;
  status: OrderStatus;
  total: Prisma.Decimal;
  stripePaymentIntentId?: string | null;
  items: OrderItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export class CartEmptyError extends Error {
  constructor() {
    super('Cart is empty');
    this.name = CartEmptyError.name;
  }
}

export class InsufficientStockError extends Error {
  constructor() {
    super('Insufficient stock');
    this.name = InsufficientStockError.name;
  }
}
