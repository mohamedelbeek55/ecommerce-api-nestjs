import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type {
  CreateProductDto,
  ProductEntity,
  ProductQueryParams,
  UpdateProductDto,
} from '../domain/product.entity';
import { IProductRepository } from '../domain/product.repository.interface';

/**
 * Prisma implementation of IProductRepository.
 *
 * This is the ONLY file in the products feature that imports Prisma.
 * Swapping to a different database means writing a new implementation of
 * IProductRepository and changing the `useClass` in products.module.ts —
 * nothing else in the business logic touches this.
 */
@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(
    params: ProductQueryParams,
  ): Promise<{ items: ProductEntity[]; total: number }> {
    const where: Prisma.ProductWhereInput = {
      ...(params.search && {
        name: { contains: params.search, mode: 'insensitive' },
      }),
      ...((params.minPrice !== undefined || params.maxPrice !== undefined) && {
        price: {
          ...(params.minPrice !== undefined && { gte: params.minPrice }),
          ...(params.maxPrice !== undefined && { lte: params.maxPrice }),
        },
      }),
      ...(params.categoryId && { categoryId: params.categoryId }),
    };
    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [params.sortBy]: params.sortOrder,
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string): Promise<ProductEntity | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  findByCategoryId(categoryId: string): Promise<ProductEntity[]> {
    return this.prisma.product.findMany({
      where: { categoryId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: CreateProductDto): Promise<ProductEntity> {
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        // Prisma accepts a string for Decimal fields and stores it exactly
        price: data.price.toString(),
        stock: data.stock,
        categoryId: data.categoryId,
      },
    });
  }

  update(id: string, data: UpdateProductDto): Promise<ProductEntity> {
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price.toString() }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }
}
