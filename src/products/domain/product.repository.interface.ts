import type {
  CreateProductDto,
  ProductEntity,
  ProductQueryParams,
  UpdateProductDto,
} from './product.entity';

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
export abstract class IProductRepository {
  abstract findAll(
    params: ProductQueryParams,
  ): Promise<{ items: ProductEntity[]; total: number }>;
  abstract findById(id: string): Promise<ProductEntity | null>;
  abstract findByCategoryId(categoryId: string): Promise<ProductEntity[]>;
  abstract create(data: CreateProductDto): Promise<ProductEntity>;
  abstract update(id: string, data: UpdateProductDto): Promise<ProductEntity>;
  abstract delete(id: string): Promise<void>;
}
