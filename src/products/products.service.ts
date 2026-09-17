import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProductEntity } from './domain/product.entity';
import { IProductRepository } from './domain/product.repository.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginatedProductsResponseDto } from './dto/paginated-products-response.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function isPrismaErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: IProductRepository,
  ) { }

  async findAll(
    query: QueryProductDto,
  ): Promise<PaginatedProductsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const result = await this.productRepository.findAll({
      skip: (page - 1) * limit,
      take: limit,
      search: query.search,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      categoryId: query.categoryId,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });

    return {
      data: result.items.map((product) => this.toResponse(product)),
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / limit),
      },
    };
  }

  async findById(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.toResponse(product);
  }

  async findByCategoryId(categoryId: string): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findByCategoryId(categoryId);
    return products.map((product) => this.toResponse(product));
  }

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    try {
      const product = await this.productRepository.create(dto);
      return this.toResponse(product);
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2003')) {
        throw new BadRequestException('Category not found');
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    await this.ensureProductExists(id);

    try {
      const product = await this.productRepository.update(id, dto);
      return this.toResponse(product);
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2003')) {
        throw new BadRequestException('Category not found');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.ensureProductExists(id);
    await this.productRepository.delete(id);
  }

  private async ensureProductExists(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
  }

  private toResponse(product: ProductEntity): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock,
      categoryId: product.categoryId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}