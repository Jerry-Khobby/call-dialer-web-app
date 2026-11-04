import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './utils';

// Behind a host's proxy (TRUST_PROXY=1, set in global-setup), rate limits must count each
// visitor's own IP from X-Forwarded-For, not the proxy's, or all users share one limit.
describe('Behind a proxy (e2e)', () => {
  let app: INestApplication<App>;
  const login = (ip: string) =>
    request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email: 'nobody@example.com', password: 'wrong-password' });

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rate-limits each visitor separately', async () => {
    for (let i = 0; i < 20; i++) await login('203.0.113.10').expect(401);
    await login('203.0.113.10').expect(429); // the 21st attempt from the same visitor

    // Another visitor through the same proxy is unaffected.
    await login('198.51.100.7').expect(401);
  });
});
