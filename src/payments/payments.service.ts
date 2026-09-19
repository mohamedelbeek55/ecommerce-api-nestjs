import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { Env } from '../config/env.validation';
import type { OrderStatus } from '../orders/domain/order.entity';
import { IOrderRepository } from '../orders/domain/order.repository.interface';
import { CreatePaymentIntentResponseDto } from './dto/create-payment-intent-response.dto';
import { WebhookResponseDto } from './dto/webhook-response.dto';

export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT');

/**
 * PaymentIntent statuses that allow a client to complete payment.
 * Anything else (succeeded, canceled, processing, requires_capture)
 * means the client secret is useless.
 */
const USABLE_PAYMENT_INTENT_STATUSES: Stripe.PaymentIntent.Status[] = [
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
];

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly orderRepository: IOrderRepository,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    config: ConfigService<Env, true>,
  ) {
    this.webhookSecret = config.get('STRIPE_WEBHOOK_SECRET', { infer: true });
  }

  private readonly webhookSecret: string;
  private readonly paymentIntentCreationLocks = new Map<
    string,
    Promise<void>
  >();

  async createPaymentIntent(
    orderId: string,
    userId: string,
  ): Promise<CreatePaymentIntentResponseDto> {
    const order = await this.orderRepository.findById(userId, orderId);
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not pending payment');
    }

    const amount = order.total.mul(100).toNumber();
    if (amount <= 0) {
      throw new BadRequestException('Order total must be greater than zero');
    }

    let paymentIntent: Stripe.PaymentIntent;
    let paymentIntentStored = false;
    if (order.stripePaymentIntentId) {
      paymentIntent = await this.stripe.paymentIntents.retrieve(
        order.stripePaymentIntentId,
      );
    } else {
      const previousCreation = this.paymentIntentCreationLocks.get(order.id);
      if (previousCreation) {
        await previousCreation;
        const updatedOrder = await this.orderRepository.findById(
          userId,
          orderId,
        );
        if (!updatedOrder?.stripePaymentIntentId) {
          throw new BadRequestException('Payment intent could not be created');
        }
        paymentIntent = await this.stripe.paymentIntents.retrieve(
          updatedOrder.stripePaymentIntentId,
        );
      } else {
        let releaseLock!: () => void;
        const creationLock = new Promise<void>((resolve) => {
          releaseLock = resolve;
        });
        this.paymentIntentCreationLocks.set(order.id, creationLock);
        try {
          const currentOrder = await this.orderRepository.findById(
            userId,
            orderId,
          );
          if (!currentOrder) {
            throw new BadRequestException('Order not found');
          }
          paymentIntent = currentOrder.stripePaymentIntentId
            ? await this.stripe.paymentIntents.retrieve(
              currentOrder.stripePaymentIntentId,
            )
            : await this.stripe.paymentIntents.create(
              {
                amount,
                currency: 'usd',
                metadata: { orderId },
                automatic_payment_methods: {
                  enabled: true,
                  allow_redirects: 'never',
                },
              },
              { idempotencyKey: `order-payment-intent:${order.id}` },
            );
          if (!currentOrder.stripePaymentIntentId) {
            await this.orderRepository.updatePaymentIntentId(
              order.id,
              paymentIntent.id,
            );
            paymentIntentStored = true;
          }
        } finally {
          releaseLock();
          this.paymentIntentCreationLocks.delete(order.id);
        }
      }
    }

    if (!paymentIntent.client_secret) {
      throw new BadRequestException('Stripe did not return a client secret');
    }

    // 🛡️ Refuse to hand out a client secret for a PaymentIntent that can no
    // longer be paid (already succeeded, canceled, processing, etc.).
    if (!USABLE_PAYMENT_INTENT_STATUSES.includes(paymentIntent.status)) {
      this.logger.error(
        `Cannot return client secret: PaymentIntent ${paymentIntent.id} ` +
        `is in status "${paymentIntent.status}" (order ${order.id})`,
      );
      throw new BadRequestException(
        `Payment intent is in "${paymentIntent.status}" state and cannot be used. ` +
        `Please create a new order.`,
      );
    }

    if (!paymentIntentStored) {
      await this.orderRepository.updatePaymentIntentId(
        order.id,
        paymentIntent.id,
      );
    }

    return { clientSecret: paymentIntent.client_secret };
  }

  async handleWebhookEvent(
    rawBody: Buffer,
    signatureHeader: string | undefined,
  ): Promise<WebhookResponseDto> {
    if (!signatureHeader) {
      throw new BadRequestException('Stripe signature is required');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signatureHeader,
        this.webhookSecret,
      );
    } catch (error) {
      this.logger.warn(
        `Rejected webhook with invalid signature: ${(error as Error).message}`,
      );
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    // Ignore event types we don't handle — return 200 so Stripe stops retrying
    if (
      event.type !== 'payment_intent.succeeded' &&
      event.type !== 'payment_intent.payment_failed'
    ) {
      return { received: true };
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // TODO(payment-flow): Do NOT cancel the order on payment_failed.
    // Stripe retries the same PaymentIntent when the customer tries a new card,
    // and canceling here breaks the retry (money charged, order canceled).
    // Proper fix: leave the order PENDING on payment_failed and only cancel on
    // explicit payment_intent.canceled, or when the order expires.
    const status: OrderStatus =
      event.type === 'payment_intent.succeeded' ? 'CONFIRMED' : 'CANCELLED';

    const order = await this.orderRepository.findByPaymentIntentId(
      paymentIntent.id,
    );
    if (!order) {
      this.logger.error(
        `Webhook ${event.id} (${event.type}) received for unknown PaymentIntent ${paymentIntent.id}`,
      );
      return { received: true };
    }

    if (paymentIntent.metadata.orderId !== order.id) {
      this.logger.error(
        `Webhook ${event.id}: PaymentIntent ${paymentIntent.id} has metadata.orderId="${paymentIntent.metadata.orderId}" but the matched order is "${order.id}"`,
      );
      return { received: true };
    }

    if (event.type === 'payment_intent.succeeded') {
      const expectedAmount = order.total.mul(100).toNumber();
      if (paymentIntent.currency !== 'usd') {
        this.logger.error(
          `Webhook ${event.id}: currency mismatch — expected "usd", got "${paymentIntent.currency}" (PI ${paymentIntent.id})`,
        );
        return { received: true };
      }
      if (paymentIntent.amount_received !== expectedAmount) {
        this.logger.error(
          `Webhook ${event.id}: amount mismatch — expected ${expectedAmount}, got ${paymentIntent.amount_received} (PI ${paymentIntent.id})`,
        );
        return { received: true };
      }
    }

    await this.orderRepository.processPaymentEvent(
      event.id,
      paymentIntent.id,
      status,
    );

    return { received: true };
  }
}