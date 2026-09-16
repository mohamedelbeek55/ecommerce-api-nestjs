import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type {
  CategoryEntity,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../domain/category.entity';
import { ICategoryRepository } from '../domain/category.repository.interface';

/**
 * Prisma implementation of ICategoryRepository.
 *
 * This is the ONLY file in the categories feature that imports Prisma.
 * Swapping to a different database means writing a new implementation of
 * ICategoryRepository and changing the `useClass` in categories.module.ts —
 * nothing else in the business logic touches this.
 */
@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<CategoryEntity[]> {
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<CategoryEntity | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  create(data: CreateCategoryDto): Promise<CategoryEntity> {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: UpdateCategoryDto): Promise<CategoryEntity> {
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}
