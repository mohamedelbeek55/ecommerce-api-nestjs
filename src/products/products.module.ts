import { Module } from '@nestjs/common';
import { IProductRepository } from './domain/product.repository.interface';
import { PrismaProductRepository } from './infrastructure/prisma-product.repository';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

/**
 * The custom provider is the DI binding that connects the abstract interface
 * (token) to the concrete Prisma implementation (value).
 *
 * Any class in this module that injects IProductRepository receives
 * PrismaProductRepository at runtime — without knowing it exists.
 *
 * To swap the database, change `useClass` here. Nothing else changes.
 */
@Module({
  controllers: [ProductsController],
  providers: [
    {
      provide: IProductRepository,
      useClass: PrismaProductRepository,
    },
    ProductsService,
  ],
  exports: [IProductRepository, ProductsService],
})
export class ProductsModule {}
