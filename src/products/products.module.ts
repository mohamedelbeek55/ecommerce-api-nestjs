import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { IProductRepository } from './domain/product.repository.interface';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaProductRepository } from './infrastructure/prisma-product.repository';

@Module({
  imports: [CloudinaryModule],
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
export class ProductsModule { }