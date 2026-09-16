import { Module } from '@nestjs/common';
import { IOrderRepository } from './domain/order.repository.interface';
import { PrismaOrderRepository } from './infrastructure/prisma-order.repository';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [
    { provide: IOrderRepository, useClass: PrismaOrderRepository },
    OrdersService,
  ],
  exports: [IOrderRepository, OrdersService],
})
export class OrdersModule {}
