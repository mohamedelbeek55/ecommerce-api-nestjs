import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { ICartRepository } from './domain/cart.repository.interface';
import { PrismaCartRepository } from './infrastructure/prisma-cart.repository';

@Module({
  controllers: [CartController],
  providers: [
    {
      provide: ICartRepository,
      useClass: PrismaCartRepository,
    },
    CartService,
  ],
  exports: [ICartRepository, CartService],
})
export class CartModule {}
