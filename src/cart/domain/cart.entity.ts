import { Prisma } from '@prisma/client';

export interface CartItemEntity {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: Prisma.Decimal;
    stock: number;
  };
}

export interface CartEntity {
  id: string;
  userId: string;
  items: CartItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}
