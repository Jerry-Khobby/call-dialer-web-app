import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Connection } from 'mongoose';
import { io, Socket } from 'socket.io-client';
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

/** Connects to the calls namespace; resolves once the handshake is accepted. */
export async function connectSocket(
  app: INestApplication<App>,
  token: string,
): Promise<Socket> {
  const url = await app.getUrl();
  const socket = io(`${url}/calls`, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', reject);
  });
  return socket;
}

/** Resolves with the next payload of `event`, or fails after `ms`. */
export function nextEvent<T = Record<string, unknown>>(
  socket: Socket,
  event: string,
  ms = 3000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for "${event}"`)),
      ms,
    );
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}
