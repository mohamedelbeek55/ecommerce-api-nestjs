import request from 'supertest';
import { createE2eApp, resetDatabase, uniqueEmail } from './e2e-test-helpers';

describe('Auth (e2e)', () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>['app'];
  let prisma: Awaited<ReturnType<typeof createE2eApp>>['prisma'];

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });

  beforeEach(() => resetDatabase(prisma));

  afterAll(() => app.close());

  it('registers, logs in, refreshes, and logs out a user', async () => {
    const email = uniqueEmail('auth');
    const password = 'StrongPassword123!';
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password, name: 'Auth User' })
      .expect(201);

    expect(register.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      }),
    );

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    const protectedResponse = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);
    expect(protectedResponse.body.email).toBe(email);

    const refreshed = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);
    expect(refreshed.body.accessToken).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(401);
  });

  it('rejects duplicate email registration with 409', async () => {
    const email = uniqueEmail('duplicate');
    const payload = { email, password: 'StrongPassword123!', name: 'User' };

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(payload)
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(payload)
      .expect(409);
  });

  it('rejects incorrect credentials with a generic 401 response', async () => {
    const email = uniqueEmail('wrong-password');
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'StrongPassword123!', name: 'User' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPassword123!' })
      .expect(401);

    expect(response.body.message).toBe('Invalid credentials');
  });

  it('requires authentication for the profile endpoint', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });
});
