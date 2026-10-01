import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProductEntity } from './domain/product.entity';
import {
  IProductRepository,
  ProductImageInput,
} from './domain/product.repository.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginatedProductsResponseDto } from './dto/paginated-products-response.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

function isPrismaErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

interface ProductImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly cloudinaryService: CloudinaryService,
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
        totalPages:
          result.total === 0 ? 0 : Math.ceil(result.total / limit),
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

  async findByCategoryId(
    categoryId: string,
  ): Promise<ProductResponseDto[]> {
    const products =
      await this.productRepository.findByCategoryId(categoryId);

    return products.map((product) => this.toResponse(product));
  }

  async create(
    dto: CreateProductDto,
    files: ProductImageFile[],
  ): Promise<ProductResponseDto> {
    this.validateImageCount(files);

    const uploadedImages: ProductImageInput[] = [];

    try {
      for (const file of files) {
        const result = await this.cloudinaryService.uploadImage(file);

        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }

      const product = await this.productRepository.create(
        dto,
        uploadedImages,
      );

      return this.toResponse(product);
    } catch (error) {
      await this.cleanupCloudinaryImages(uploadedImages);

      if (isPrismaErrorWithCode(error, 'P2003')) {
        throw new BadRequestException('Category not found');
      }

      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    files?: ProductImageFile[],
  ): Promise<ProductResponseDto> {
    const existingProduct = await this.productRepository.findById(id);

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    const hasNewImages = files !== undefined && files.length > 0;

    if (files !== undefined && files.length > 5) {
      throw new BadRequestException(
        'Product can have a maximum of 5 images',
      );
    }

    if (hasNewImages) {
      this.validateImageCount(files);
    }

    const uploadedImages: ProductImageInput[] = [];

    try {
      if (hasNewImages) {
        for (const file of files) {
          const result = await this.cloudinaryService.uploadImage(file);

          uploadedImages.push({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }

      const product = await this.productRepository.update(
        id,
        dto,
        hasNewImages ? uploadedImages : undefined,
      );

      /*
       * The database is now the source of truth.
       * Only after the DB update succeeds do we remove the old
       * Cloudinary assets.
       */
      if (hasNewImages) {
        await this.cleanupCloudinaryImages(
          existingProduct.images.map((image) => ({
            url: image.url,
            publicId: image.publicId,
          })),
        );
      }

      return this.toResponse(product);
    } catch (error) {
      /*
       * If the DB update failed, remove the newly uploaded images
       * because they are no longer referenced by the database.
       */
      await this.cleanupCloudinaryImages(uploadedImages);

      if (isPrismaErrorWithCode(error, 'P2003')) {
        throw new BadRequestException('Category not found');
      }

      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.cleanupCloudinaryImages(
      product.images.map((image) => ({
        url: image.url,
        publicId: image.publicId,
      })),
    );

    await this.productRepository.delete(id);
  }

  private validateImageCount(files: ProductImageFile[]): void {
    if (!files || files.length < 1 || files.length > 5) {
      throw new BadRequestException(
        'Product must have between 1 and 5 images',
      );
    }
  }

  private async cleanupCloudinaryImages(
    images: ProductImageInput[],
  ): Promise<void> {
    if (images.length === 0) {
      return;
    }

    await Promise.allSettled(
      images.map((image) =>
        this.cloudinaryService.deleteImage(image.publicId),
      ),
    );
  }

  private toResponse(product: ProductEntity): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock,
      categoryId: product.categoryId,
      images: product.images.map((image) => ({
        id: image.id,
        url: image.url,
        publicId: image.publicId,
        createdAt: image.createdAt,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}