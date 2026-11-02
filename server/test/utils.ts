import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Connection } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

/** Boots the real app on a random port (so socket clients can connect) with an empty database. */
export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.listen(0);
  await resetDatabase(app.get<Connection>(getConnectionToken()));
  return app;
}

/**
 * Empties every collection but keeps its indexes. dropDatabase() would also drop the
 * unique indexes Mongoose just built, so duplicate checks would pass or fail by timing.
 */
async function resetDatabase(connection: Connection): Promise<void> {
  await Promise.all(
    connection.modelNames().map((name) => connection.model(name).init()),
  );
  await Promise.all(
    Object.values(connection.collections).map((c) => c.deleteMany({})),
  );
}

export type ApiUser = {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
};
export type AuthResponse = { accessToken: string; user: ApiUser };
export type TestUser = ApiUser & { token: string };

let registered = 0;

/** Registers a fresh user (unique email and number unless overridden) and returns its token. */
export async function registerUser(
  app: INestApplication<App>,
  overrides: Partial<
    Record<'fullName' | 'email' | 'password' | 'phoneNumber', string>
  > = {},
): Promise<TestUser> {
  registered++;
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      fullName: `Test User ${registered}`,
      email: `user${registered}@example.com`,
      password: 'password123',
      phoneNumber: `02000000${String(registered).padStart(2, '0')}`,
      ...overrides,
    })
    .expect(201);
  const { accessToken, user } = res.body as AuthResponse;
  return { ...user, token: accessToken };
}

/** supertest agent that sends the user's Bearer token. */
export function api(app: INestApplication<App>, user: TestUser) {
  const server = app.getHttpServer();
  const auth = (r: request.Test) =>
    r.set('Authorization', `Bearer ${user.token}`);
  return {
    get: (url: string) => auth(request(server).get(url)),
    post: (url: string) => auth(request(server).post(url)),
    patch: (url: string) => auth(request(server).patch(url)),
    delete: (url: string) => auth(request(server).delete(url)),
  };
}
