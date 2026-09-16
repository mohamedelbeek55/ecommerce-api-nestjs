import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ICategoryRepository } from './domain/category.repository.interface';
import type { CategoryEntity } from './domain/category.entity';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const category: CategoryEntity = {
    id: 'category-1',
    name: 'Books',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    categoryRepository = {
      findAll: jest.fn().mockResolvedValue([category]),
      findById: jest.fn().mockResolvedValue(category),
      create: jest.fn().mockResolvedValue(category),
      update: jest.fn().mockResolvedValue(category),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    service = new CategoriesService(
      categoryRepository as unknown as ICategoryRepository,
    );
  });

  describe('findAll', () => {
    it('returns all categories', async () => {
      await expect(service.findAll()).resolves.toEqual([category]);
      expect(categoryRepository.findAll).toHaveBeenCalledWith();
    });
  });

  describe('findById', () => {
    it('returns the category when it exists', async () => {
      await expect(service.findById(category.id)).resolves.toEqual(category);
      expect(categoryRepository.findById).toHaveBeenCalledWith(category.id);
    });

    it('throws NotFoundException when the category does not exist', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(service.findById(category.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and returns a category', async () => {
      const dto = { name: category.name };

      await expect(service.create(dto)).resolves.toEqual(category);
      expect(categoryRepository.create).toHaveBeenCalledWith(dto);
    });

    it('translates a duplicate name error to ConflictException', async () => {
      categoryRepository.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create({ name: category.name })).rejects.toEqual(
        new ConflictException('Category name already exists'),
      );
    });
  });

  describe('update', () => {
    it('updates and returns a category', async () => {
      const dto = { name: 'New name' };

      await expect(service.update(category.id, dto)).resolves.toEqual(category);
      expect(categoryRepository.findById).toHaveBeenCalledWith(category.id);
      expect(categoryRepository.update).toHaveBeenCalledWith(category.id, dto);
    });

    it('throws NotFoundException when updating a missing category', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(category.id, { name: 'New name' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(categoryRepository.update).not.toHaveBeenCalled();
    });

    it('translates a rename collision to ConflictException', async () => {
      categoryRepository.update.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.update(category.id, { name: 'Existing name' }),
      ).rejects.toEqual(
        new ConflictException('Category name already exists'),
      );
    });
  });

  describe('delete', () => {
    it('deletes an existing category', async () => {
      await expect(service.delete(category.id)).resolves.toBeUndefined();
      expect(categoryRepository.findById).toHaveBeenCalledWith(category.id);
      expect(categoryRepository.delete).toHaveBeenCalledWith(category.id);
    });

    it('throws NotFoundException when deleting a missing category', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(service.delete(category.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(categoryRepository.delete).not.toHaveBeenCalled();
    });

    it('translates a foreign-key restriction error to BadRequestException', async () => {
      categoryRepository.delete.mockRejectedValue({ code: 'P2003' });

      await expect(service.delete(category.id)).rejects.toEqual(
        new BadRequestException(
          'Cannot delete a category that still has products',
        ),
      );
    });
  });
});
