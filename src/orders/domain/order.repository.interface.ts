import type { OrderEntity, OrderStatus } from './order.entity';

/**
 * Abstract class used as an injection token.
 *
 * Services depend only on this abstraction and never import Prisma.
 */
export abstract class IOrderRepository {
  abstract checkout(userId: string): Promise<OrderEntity>;
  abstract findAllByUserId(userId: string): Promise<OrderEntity[]>;
  abstract findById(
    userId: string,
    orderId: string,
  ): Promise<OrderEntity | null>;
  abstract findByPaymentIntentId(
    paymentIntentId: string,
  ): Promise<OrderEntity | null>;
  abstract updateStatus(orderId: string, status: OrderStatus): Promise<void>;
  abstract updatePaymentIntentId(
    orderId: string,
    paymentIntentId: string,
  ): Promise<void>;
  abstract processPaymentEvent(
    eventId: string,
    paymentIntentId: string,
    status: OrderStatus,
  ): Promise<void>;
}
