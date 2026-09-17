import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CategoryEntity } from './domain/category.entity';
import { ICategoryRepository } from './domain/category.repository.interface';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

function isPrismaErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
  ) { }

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.findAll();
    return categories.map((category) => this.toResponse(category));
  }

  async findById(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.toResponse(category);
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    try {
      const category = await this.categoryRepository.create(dto);
      return this.toResponse(category);
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2002')) {
        throw new ConflictException('Category name already exists');
      }

      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    await this.ensureCategoryExists(id);

    try {
      const category = await this.categoryRepository.update(id, dto);
      return this.toResponse(category);
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2002')) {
        throw new ConflictException('Category name already exists');
      }

      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.ensureCategoryExists(id);

    try {
      await this.categoryRepository.delete(id);
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2003')) {
        throw new BadRequestException(
          'Cannot delete a category that still has products',
        );
      }

      throw error;
    }
  }

  private async ensureCategoryExists(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  private toResponse(category: CategoryEntity): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      createdAt: category.createdAt,
    };
  }
}