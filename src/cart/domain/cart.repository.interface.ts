import type { CartEntity } from './cart.entity';

/**
 * Abstract class used as an injection token.
 *
 * Why abstract class instead of a TypeScript interface?
 * Interfaces are erased at compile time — NestJS's DI container can't
 * reference them at runtime. An abstract class emits a real JavaScript
 * symbol that survives compilation, so it can be used as a DI token.
 *
 * Services depend ONLY on this abstraction — they never import Prisma.
 */
export abstract class ICartRepository {
  abstract findByUserId(userId: string): Promise<CartEntity | null>;
  abstract createForUser(userId: string): Promise<CartEntity>;
  abstract addItem(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<CartEntity>;
  abstract updateItemQuantity(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<CartEntity>;
  abstract removeItem(cartId: string, productId: string): Promise<CartEntity>;
  abstract clear(cartId: string): Promise<CartEntity>;
}
