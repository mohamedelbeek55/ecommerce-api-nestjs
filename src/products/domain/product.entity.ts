import { Prisma } from '@prisma/client';

/**
 * Domain entity — mirrors the Prisma Product model but lives in the domain
 * layer. Services and the repository interface work with this type only;
 * they never import Prisma directly.
 *
 * price: Prisma.Decimal preserves exact monetary values across the
 * application boundary. Serialise to string when sending over HTTP.
 */
export interface ProductEntity {
  id: string;
  name: string;
  description: string;
  price: Prisma.Decimal;
  stock: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDto {
  name: string;
  description: string;
  /** Accepts a number or numeric string; the repository stores it as Decimal */
  price: number | string;
  stock: number;
  categoryId: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number | string;
  stock?: number;
  categoryId?: string;
}

export interface ProductQueryParams {
  skip: number;
  take: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  sortBy: 'name' | 'price' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
