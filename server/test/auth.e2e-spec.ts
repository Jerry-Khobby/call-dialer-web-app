import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { api, AuthResponse, createTestApp, registerUser } from './utils';

type ErrorBody = { message: string | string[] };

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const register = (body: object) =>
    request(app.getHttpServer()).post('/api/auth/register').send(body);
  const login = (body: object) =>
    request(app.getHttpServer()).post('/api/auth/login').send(body);

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers and returns a token and the public profile', async () => {
    const res = await register({
      fullName: 'Ama Owusu',
      email: 'Ama@Example.com',
      password: 'password123',
      phoneNumber: '024 123 4567',
    }).expect(201);

    const { accessToken, user } = res.body as AuthResponse;
    expect(accessToken).toEqual(expect.any(String));
    expect(user).toEqual({
      id: expect.any(String),
      email: 'ama@example.com',
      fullName: 'Ama Owusu',
      phoneNumber: '024 123 4567',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('rejects a second account with the same email or number (any formatting)', async () => {
    await registerUser(app, {
      email: 'dup@example.com',
      phoneNumber: '0551112222',
    });

    const sameEmail = await register({
      fullName: 'X',
      email: 'DUP@example.com',
      password: 'password123',
      phoneNumber: '0559999999',
    }).expect(409);
    expect((sameEmail.body as ErrorBody).message).toMatch(/email/);

    const samePhone = await register({
      fullName: 'X',
      email: 'other@example.com',
      password: 'password123',
      phoneNumber: '055-111-2222',
    }).expect(409);
    expect((samePhone.body as ErrorBody).message).toMatch(/phone number/);
  });

  it('validates input and rejects unknown fields', async () => {
    const res = await register({
      fullName: '',
      email: 'not-an-email',
      password: 'short',
      phoneNumber: 'abc',
      isAdmin: true,
    }).expect(400);
    const messages = (res.body as ErrorBody).message as string[];
    expect(messages).toEqual(
      expect.arrayContaining([
        'property isAdmin should not exist',
        'fullName should not be empty',
        'email must be an email',
        'password must be longer than or equal to 8 characters',
        expect.stringMatching(/^phoneNumber must be 3–15 digits/),
      ]),
    );
  });

  it('logs in with the right password only', async () => {
    const user = await registerUser(app, { email: 'login@example.com' });

    const ok = await login({
      email: 'LOGIN@example.com',
      password: 'password123',
    }).expect(200);
    expect((ok.body as AuthResponse).user.id).toBe(user.id);

    await login({
      email: 'login@example.com',
      password: 'wrong-password',
    }).expect(401);
    await login({
      email: 'nobody@example.com',
      password: 'password123',
    }).expect(401);
  });

  it("doesn't reveal through timing whether an email has an account", async () => {
    await registerUser(app, { email: 'timing@example.com' });
    const time = async (email: string) => {
      const start = performance.now();
      await login({ email, password: 'wrong-password' }).expect(401);
      return performance.now() - start;
    };
    await time('warmup@example.com'); // The dummy hash is computed on first use

    const wrongPassword = await time('timing@example.com');
    const unknownEmail = await time('nobody-here@example.com');
    // Before the fix an unknown email answered in a few ms against ~250 ms.
    expect(unknownEmail).toBeGreaterThan(wrongPassword * 0.5);
  });

  it('GET /auth/me needs a valid token', async () => {
    const user = await registerUser(app);
    const me = await api(app, user).get('/api/auth/me').expect(200);
    expect((me.body as AuthResponse['user']).email).toBe(user.email);

    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
  });
});
