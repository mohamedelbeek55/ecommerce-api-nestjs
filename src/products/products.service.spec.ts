import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ProductEntity } from './domain/product.entity';
import { IProductRepository } from './domain/product.repository.interface';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    findByCategoryId: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const product: ProductEntity = {
    id: 'product-1',
    name: 'Book',
    description: 'A book',
    price: new Prisma.Decimal('12.50'),
    stock: 4,
    categoryId: 'category-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    productRepository = {
      findAll: jest.fn().mockResolvedValue({ items: [product], total: 1 }),
      findById: jest.fn().mockResolvedValue(product),
      findByCategoryId: jest.fn().mockResolvedValue([product]),
      create: jest.fn().mockResolvedValue(product),
      update: jest.fn().mockResolvedValue(product),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    service = new ProductsService(
      productRepository as unknown as IProductRepository,
    );
  });

  describe('findAll', () => {
    it('uses default pagination and returns metadata', async () => {
      await expect(service.findAll({})).resolves.toEqual({
        data: [expect.objectContaining({ id: product.id, price: '12.5' })],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
      expect(productRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        search: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        categoryId: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('passes search to the repository', async () => {
      await service.findAll({ page: 2, limit: 5, search: 'book' });

      expect(productRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5, search: 'book' }),
      );
    });

    it('passes price filters to the repository', async () => {
      await service.findAll({ minPrice: 10, maxPrice: 50 });

      expect(productRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 10, maxPrice: 50 }),
      );
    });

    it('passes the category filter to the repository', async () => {
      await service.findAll({ categoryId: 'category-2' });

      expect(productRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'category-2' }),
      );
    });

    it('passes custom sorting to the repository', async () => {
      await service.findAll({ sortBy: 'price', sortOrder: 'asc' });

      expect(productRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'price', sortOrder: 'asc' }),
      );
    });

    it('returns empty data and zero total pages for an empty result', async () => {
      productRepository.findAll.mockResolvedValue({ items: [], total: 0 });

      await expect(service.findAll({})).resolves.toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      });
    });
  });

  describe('findById', () => {
    it('returns the product when it exists', async () => {
      await expect(service.findById(product.id)).resolves.toEqual(
        expect.objectContaining({ id: product.id, price: '12.5' }),
      );
      expect(productRepository.findById).toHaveBeenCalledWith(product.id);
    });

    it('throws NotFoundException when the product does not exist', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.findById(product.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findByCategoryId', () => {
    it('returns products for the category', async () => {
      await expect(
        service.findByCategoryId(product.categoryId),
      ).resolves.toEqual([expect.objectContaining({ id: product.id })]);
      expect(productRepository.findByCategoryId).toHaveBeenCalledWith(
        product.categoryId,
      );
    });
  });

  describe('create', () => {
    it('creates and returns a product', async () => {
      const dto = {
        name: product.name,
        description: product.description,
        price: 12.5,
        stock: product.stock,
        categoryId: product.categoryId,
      };

      await expect(service.create(dto)).resolves.toEqual(
        expect.objectContaining({ id: product.id, price: '12.5' }),
      );
      expect(productRepository.create).toHaveBeenCalledWith(dto);
    });

    it('translates a missing category error to BadRequestException', async () => {
      productRepository.create.mockRejectedValue({ code: 'P2003' });

      await expect(
        service.create({
          name: product.name,
          description: product.description,
          price: 12.5,
          stock: product.stock,
          categoryId: product.categoryId,
        }),
      ).rejects.toEqual(new BadRequestException('Category not found'));
    });
  });

  describe('update', () => {
    it('updates and returns a product', async () => {
      const dto = { name: 'Updated book' };

      await expect(service.update(product.id, dto)).resolves.toEqual(
        expect.objectContaining({ id: product.id, price: '12.5' }),
      );
      expect(productRepository.findById).toHaveBeenCalledWith(product.id);
      expect(productRepository.update).toHaveBeenCalledWith(product.id, dto);
    });

    it('throws NotFoundException when updating a missing product', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(product.id, { name: 'Updated book' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(productRepository.update).not.toHaveBeenCalled();
    });

    it('translates a missing category error during update', async () => {
      productRepository.update.mockRejectedValue({ code: 'P2003' });

      await expect(
        service.update(product.id, { categoryId: 'missing-category' }),
      ).rejects.toEqual(new BadRequestException('Category not found'));
    });
  });

  describe('delete', () => {
    it('deletes an existing product', async () => {
      await expect(service.delete(product.id)).resolves.toBeUndefined();
      expect(productRepository.findById).toHaveBeenCalledWith(product.id);
      expect(productRepository.delete).toHaveBeenCalledWith(product.id);
    });

    it('throws NotFoundException when deleting a missing product', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.delete(product.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(productRepository.delete).not.toHaveBeenCalled();
    });
  });
});
