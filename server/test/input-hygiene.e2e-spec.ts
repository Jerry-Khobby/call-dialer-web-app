import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  api,
  AuthResponse,
  createTestApp,
  registerUser,
  TestUser,
} from './utils';

// Inputs a client (or a hand-written request) can send that must give a clean
// 400, never a 500 from the database or a null stored where the client expects a string.
describe('Input hygiene (e2e)', () => {
  let app: INestApplication<App>;
  let user: TestUser;
  let contactId: string;

  beforeAll(async () => {
    app = await createTestApp();
    user = await registerUser(app);
    const res = await api(app, user)
      .post('/api/contacts')
      .send({ firstName: 'Kofi', phoneNumber: '0245550000' })
      .expect(201);
    contactId = (res.body as { id: string }).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects whitespace-only names instead of failing in the database', async () => {
    await api(app, user)
      .post('/api/contacts')
      .send({ firstName: '   ', phoneNumber: '0245550001' })
      .expect(400);
    await api(app, user)
      .patch(`/api/contacts/${contactId}`)
      .send({ firstName: '   ' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        fullName: '   ',
        email: 'blank@example.com',
        password: 'password123',
        phoneNumber: '0245550002',
      })
      .expect(400);
  });

  it('rejects null for optional fields', async () => {
    await api(app, user)
      .patch(`/api/contacts/${contactId}`)
      .send({ firstName: null })
      .expect(400);
    await api(app, user)
      .patch(`/api/contacts/${contactId}`)
      .send({ favorite: null })
      .expect(400);
    await api(app, user)
      .post('/api/contacts')
      .send({ firstName: 'Ama', lastName: null, phoneNumber: '0245550003' })
      .expect(400);
    await api(app, user)
      .post('/api/calls')
      .send({ phoneNumber: '0245550003', callType: 'outgoing', duration: null })
      .expect(400);
  });

  it('trims surrounding spaces before validating and saving', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        fullName: '  Esi Boateng ',
        email: '  Esi@Example.com ',
        password: 'password123',
        phoneNumber: ' 0245550004 ',
      })
      .expect(201);
    expect((res.body as AuthResponse).user).toMatchObject({
      fullName: 'Esi Boateng',
      email: 'esi@example.com',
      phoneNumber: '0245550004',
    });
  });
});
