import type {
  CreateProductDto,
  ProductEntity,
  ProductQueryParams,
  UpdateProductDto,
} from './product.entity';

export interface ProductImageInput {
  url: string;
  publicId: string;
}

export abstract class IProductRepository {
  abstract findAll(
    params: ProductQueryParams,
  ): Promise<{ items: ProductEntity[]; total: number }>;

  abstract findById(id: string): Promise<ProductEntity | null>;

  abstract findByCategoryId(categoryId: string): Promise<ProductEntity[]>;

  abstract create(
    data: CreateProductDto,
    images?: ProductImageInput[],
  ): Promise<ProductEntity>;

  abstract update(
    id: string,
    data: UpdateProductDto,
    images?: ProductImageInput[],
  ): Promise<ProductEntity>;

  abstract delete(id: string): Promise<void>;
}