import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { OrderEntity } from './domain/order.entity';
import {
  CartEmptyError,
  InsufficientStockError,
} from './domain/order.entity';
import { IOrderRepository } from './domain/order.repository.interface';
import { OrderResponseDto } from './dto/order-response.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly orderRepository: IOrderRepository) { }

  async checkout(userId: string): Promise<OrderResponseDto> {
    try {
      return this.toResponse(await this.orderRepository.checkout(userId));
    } catch (error) {
      if (error instanceof CartEmptyError) {
        throw new BadRequestException('Cart is empty');
      }
      if (error instanceof InsufficientStockError) {
        throw new BadRequestException('Insufficient stock');
      }
      throw error;
    }
  }

  async findAll(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.findAllByUserId(userId);
    return orders.map((order) => this.toResponse(order));
  }

  async findById(userId: string, orderId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(userId, orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.toResponse(order);
  }

  private toResponse(order: OrderEntity): OrderResponseDto {
    return {
      id: order.id,
      status: order.status as OrderResponseDto['status'],
      total: order.total.toString(),
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice.toString(),
        quantity: item.quantity,
        subtotal: item.subtotal.toString(),
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}