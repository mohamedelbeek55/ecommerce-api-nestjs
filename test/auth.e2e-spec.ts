import request from 'supertest';
import { createE2eApp, resetDatabase, uniqueEmail } from './e2e-test-helpers';

describe('Cart and orders (e2e)', () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>['app'];
  let prisma: Awaited<ReturnType<typeof createE2eApp>>['prisma'];

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });

  beforeEach(() => resetDatabase(prisma));

  afterAll(() => app.close());

  async function createUser(label: string) {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail(label),
        password: 'StrongPassword123!',
        name: label,
      })
      .expect(201);
    return response.body.accessToken as string;
  }

  async function createProduct(stock: number) {
    const category = await prisma.category.create({
      data: { name: `Category-${Date.now()}-${Math.random()}` },
    });
    return prisma.product.create({
      data: {
        name: `Product-${Date.now()}-${Math.random()}`,
        description: 'E2E product',
        price: '12.50',
        stock,
        categoryId: category.id,
      },
    });
  }

  it('adds a product, checks out, and clears the cart', async () => {
    const token = await createUser('cart-checkout');
    const product = await createProduct(5);

    const cart = await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.id, quantity: 2 })
      .expect(201);
    expect(cart.body.items).toHaveLength(1);

    const order = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(order.body.total).toBe('25');

    const emptyCart = await request(app.getHttpServer())
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(emptyCart.body.items).toEqual([]);

    await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('keeps stock unchanged when checkout cannot fulfill the cart', async () => {
    const token = await createUser('insufficient-stock');
    const product = await createProduct(2);

    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.id, quantity: 3 })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
    expect(response.body.message).toBe('Insufficient stock');

    const unchanged = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });
    expect(unchanged.stock).toBe(2);
  });

  it('returns 404 when another user requests the order', async () => {
    const firstToken = await createUser('order-owner');
    const secondToken = await createUser('other-user');
    const product = await createProduct(2);

    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ productId: product.id, quantity: 1 })
      .expect(201);
    const order = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/orders/${order.body.id}`)
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(404);
  });
});
