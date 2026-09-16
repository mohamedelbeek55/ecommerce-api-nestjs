import { Module } from '@nestjs/common';
import { ICategoryRepository } from './domain/category.repository.interface';
import { PrismaCategoryRepository } from './infrastructure/prisma-category.repository';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController],
  providers: [
    {
      provide: ICategoryRepository,
      useClass: PrismaCategoryRepository,
    },
    CategoriesService,
  ],
  exports: [ICategoryRepository, CategoriesService],
})
export class CategoriesModule {}
