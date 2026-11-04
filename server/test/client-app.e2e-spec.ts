import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './utils';

// In production one service serves the Angular build and the API (CLIENT_DIST points
// these tests at a small fixture build).
describe('Serving the app (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves index.html, never cached, with the app security policy', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.text).toContain('Dialer test build');
    expect(res.headers['cache-control']).toBe('no-cache');
    const csp = res.headers['content-security-policy'];
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("script-src-attr 'none'");
    expect(csp).toContain('font-src');
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('answers app routes with index.html so deep links load', async () => {
    const res = await request(app.getHttpServer())
      .get('/contacts/6ae9b45f72a68851d8c1ffea/edit')
      .expect(200);
    expect(res.text).toContain('Dialer test build');
  });

  it('caches content-hashed files for a year, other files not at all', async () => {
    const hashed = await request(app.getHttpServer())
      .get('/main-ABCD1234.js')
      .expect(200);
    expect(hashed.headers['cache-control']).toBe(
      'public, max-age=31536000, immutable',
    );
    const icon = await request(app.getHttpServer())
      .get('/favicon.svg')
      .expect(200);
    expect(icon.headers['cache-control']).toBe('no-cache');
  });

  it('leaves the API alone: JSON, and 404 for unknown API paths', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
    const missing = await request(app.getHttpServer())
      .get('/api/no-such-route')
      .expect(404);
    expect(missing.headers['content-type']).toMatch(/json/);
  });
});
