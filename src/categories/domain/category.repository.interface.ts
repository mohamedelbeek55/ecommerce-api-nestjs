import type {
  CategoryEntity,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './category.entity';

/**
 * Abstract class used as an injection token.
 *
 * Why abstract class instead of a TypeScript interface?
 * Interfaces are erased at compile time — NestJS's DI container can't
 * reference them at runtime. An abstract class emits a real JavaScript
 * symbol that survives compilation, so it can be used as a DI token.
 *
 * Services depend ONLY on this abstraction — they never import Prisma.
 */
export abstract class ICategoryRepository {
  abstract findAll(): Promise<CategoryEntity[]>;
  abstract findById(id: string): Promise<CategoryEntity | null>;
  abstract create(data: CreateCategoryDto): Promise<CategoryEntity>;
  abstract update(id: string, data: UpdateCategoryDto): Promise<CategoryEntity>;
  abstract delete(id: string): Promise<void>;
}
