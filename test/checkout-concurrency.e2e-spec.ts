import request from 'supertest';
import { createE2eApp, resetDatabase, uniqueEmail } from './e2e-test-helpers';

describe('Checkout concurrency (e2e)', () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>['app'];
  let prisma: Awaited<ReturnType<typeof createE2eApp>>['prisma'];

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });

  beforeEach(() => resetDatabase(prisma));

  afterAll(() => app.close());

  it('allows exactly one checkout when stock is one', async () => {
    const category = await prisma.category.create({
      data: { name: `Concurrency-${Date.now()}` },
    });
    const product = await prisma.product.create({
      data: {
        name: `Concurrent product-${Date.now()}`,
        description: 'Concurrency product',
        price: '10.00',
        stock: 1,
        categoryId: category.id,
      },
    });

    const register = async (label: string) => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: uniqueEmail(label),
          password: 'StrongPassword123!',
          name: label,
        })
        .expect(201);
      return response.body.accessToken as string;
    };
    const [firstToken, secondToken] = await Promise.all([
      register('concurrent-one'),
      register('concurrent-two'),
    ]);

    await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${firstToken}`)
        .send({ productId: product.id, quantity: 1 })
        .expect(201),
      request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${secondToken}`)
        .send({ productId: product.id, quantity: 1 })
        .expect(201),
    ]);

    const results = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${firstToken}`),
      request(app.getHttpServer())
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${secondToken}`),
    ]);
    const statuses = results.map((result) => result.status).sort();

    expect(statuses).toEqual([201, 400]);
    expect(
      results.find((result) => result.status === 400)?.body.message,
    ).toBe('Insufficient stock');

    const finalProduct = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });
    expect(finalProduct.stock).toBe(0);
  });
});
