import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import request from 'supertest';
import {
  createE2eApp,
  resetDatabase,
  uniqueEmail,
} from './e2e-test-helpers';

describe('Payments (e2e)', () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>['app'];
  let prisma: Awaited<ReturnType<typeof createE2eApp>>['prisma'];
  let stripe: Stripe;

  beforeAll(async () => {
    stripe = new Stripe('sk_test_e2e_key');
    stripe.paymentIntents.create = jest.fn().mockResolvedValue({
      id: 'pi_test_e2e',
      client_secret: 'cs_test_e2e',
    });
    stripe.paymentIntents.retrieve = jest.fn().mockResolvedValue({
      id: 'pi_test_e2e',
      client_secret: 'cs_test_e2e',
    });
    ({ app, prisma } = await createE2eApp(stripe));
  });

  beforeEach(() => resetDatabase(prisma));

  afterAll(() => app.close());

  it('creates a PaymentIntent and confirms the order from a signed webhook', async () => {
    const user = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail('payment'),
        password: 'StrongPassword123!',
        name: 'Payment User',
      })
      .expect(201);

    const category = await prisma.category.create({
      data: { name: `Payment-${Date.now()}` },
    });
    const product = await prisma.product.create({
      data: {
        name: `Payment product-${Date.now()}`,
        description: 'Payment product',
        price: new Prisma.Decimal('19.99'),
        stock: 2,
        categoryId: category.id,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${user.body.accessToken}`)
      .send({ productId: product.id, quantity: 1 })
      .expect(201);
    const order = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${user.body.accessToken}`)
      .expect(201);

    const intent = await request(app.getHttpServer())
      .post(`/api/v1/payments/orders/${order.body.id}/intent`)
      .set('Authorization', `Bearer ${user.body.accessToken}`)
      .expect(201);
    expect(intent.body).toEqual({ clientSecret: 'cs_test_e2e' });

    const repeatedIntent = await request(app.getHttpServer())
      .post(`/api/v1/payments/orders/${order.body.id}/intent`)
      .set('Authorization', `Bearer ${user.body.accessToken}`)
      .expect(201);
    expect(repeatedIntent.body).toEqual({ clientSecret: 'cs_test_e2e' });
    expect(stripe.paymentIntents.create).toHaveBeenCalledTimes(1);

    const payload = JSON.stringify({
      id: 'evt_payment_succeeded',
      object: 'event',
      api_version: '2026-01-01',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_test_e2e',
          object: 'payment_intent',
          amount_received: 1999,
          currency: 'usd',
          metadata: { orderId: order.body.id },
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: null,
      type: 'payment_intent.succeeded',
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_e2e_secret',
    });

    const webhookResponse = await request(app.getHttpServer())
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload);
    expect(webhookResponse.status).toBe(201);

    await expect(
      prisma.order.findUniqueOrThrow({ where: { id: order.body.id } }),
    ).resolves.toMatchObject({ status: 'CONFIRMED' });

    await request(app.getHttpServer())
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload)
      .expect(201);

    await expect(
      prisma.order.findUniqueOrThrow({ where: { id: order.body.id } }),
    ).resolves.toMatchObject({ status: 'CONFIRMED' });
  });

  it('rejects an invalid webhook signature', async () => {
    const payload = JSON.stringify({
      id: 'evt_invalid_signature',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_unknown' } },
    });

    await request(app.getHttpServer())
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'invalid')
      .send(payload)
      .expect(400);
  });

  it('uses the same Stripe idempotency key for concurrent intent requests', async () => {
    const user = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail('concurrent-payment'),
        password: 'StrongPassword123!',
        name: 'Concurrent Payment User',
      })
      .expect(201);
    const category = await prisma.category.create({
      data: { name: `Concurrent-payment-${Date.now()}` },
    });
    const product = await prisma.product.create({
      data: {
        name: `Concurrent-payment-product-${Date.now()}`,
        description: 'Payment product',
        price: '9.99',
        stock: 2,
        categoryId: category.id,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${user.body.accessToken}`)
      .send({ productId: product.id, quantity: 1 })
      .expect(201);
    const order = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${user.body.accessToken}`)
      .expect(201);

    const results = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/v1/payments/orders/${order.body.id}/intent`)
        .set('Authorization', `Bearer ${user.body.accessToken}`),
      request(app.getHttpServer())
        .post(`/api/v1/payments/orders/${order.body.id}/intent`)
        .set('Authorization', `Bearer ${user.body.accessToken}`),
    ]);

    expect(results.map((result) => result.status)).toEqual([201, 201]);
    const createCalls = (stripe.paymentIntents.create as jest.Mock).mock
      .calls;
    const concurrentCalls = createCalls.filter(
      ([params]) => params.metadata.orderId === order.body.id,
    );
    expect(concurrentCalls).toHaveLength(1);
    expect(concurrentCalls[0][1].idempotencyKey).toBe(
      `order-payment-intent:${order.body.id}`,
    );
  });
});
