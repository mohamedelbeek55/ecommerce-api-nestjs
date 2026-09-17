import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { Env } from '../config/env.validation';
import type { OrderStatus } from '../orders/domain/order.entity';
import { IOrderRepository } from '../orders/domain/order.repository.interface';
import { CreatePaymentIntentResponseDto } from './dto/create-payment-intent-response.dto';
import { WebhookResponseDto } from './dto/webhook-response.dto';
export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT');

@Injectable()
export class PaymentsService {
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
          throw new BadRequestException(
            'Payment intent could not be created',
          );
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
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    if (
      event.type !== 'payment_intent.succeeded' &&
      event.type !== 'payment_intent.payment_failed'
    ) {
      return { received: true };
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const status: OrderStatus =
      event.type === 'payment_intent.succeeded' ? 'CONFIRMED' : 'CANCELLED';

    const order = await this.orderRepository.findByPaymentIntentId(
      paymentIntent.id,
    );
    if (!order) {
      return { received: true };
    }
    if (paymentIntent.metadata.orderId !== order.id) {
      return { received: true };
    }
    if (
      event.type === 'payment_intent.succeeded' &&
      (paymentIntent.currency !== 'usd' ||
        paymentIntent.amount_received !== order.total.mul(100).toNumber())
    ) {
      return { received: true };
    }

    await this.orderRepository.processPaymentEvent(
      event.id,
      paymentIntent.id,
      status,
    );

    return { received: true };
  }
}
