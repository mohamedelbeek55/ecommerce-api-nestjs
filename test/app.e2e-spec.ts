import request from 'supertest';
import { createE2eApp } from './e2e-test-helpers';

describe('Application (e2e)', () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>['app'];

  beforeAll(async () => {
    ({ app } = await createE2eApp());
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
        expect(body.database).toBe('up');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
