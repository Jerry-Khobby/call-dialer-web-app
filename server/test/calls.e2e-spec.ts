import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { api, createTestApp, registerUser, TestUser } from './utils';

type ApiCall = {
  id: string;
  phoneNumber: string;
  callType: string;
  duration: number;
  calledAt: string;
};

describe('Call history (e2e)', () => {
  let app: INestApplication<App>;
  let alice: TestUser;
  let bob: TestUser;

  const record = (user: TestUser, body: object) =>
    api(app, user).post('/api/calls').send(body);
  const list = async (user: TestUser, query = '') =>
    (await api(app, user).get(`/api/calls${query}`).expect(200))
      .body as ApiCall[];

  beforeAll(async () => {
    app = await createTestApp();
    alice = await registerUser(app);
    bob = await registerUser(app);

    await record(alice, {
      phoneNumber: '0241234567',
      callType: 'missed',
      calledAt: '2026-11-01T09:00:00.000Z',
    }).expect(201);
    await record(alice, {
      phoneNumber: '*123#',
      callType: 'outgoing',
      duration: 42,
      calledAt: '2026-11-01T10:00:00.000Z',
    }).expect(201);
    await record(alice, {
      phoneNumber: '0205559870',
      callType: 'incoming',
      duration: 300,
      calledAt: '2026-11-01T08:00:00.000Z',
    }).expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists newest first, in the shape the client uses', async () => {
    const calls = await list(alice);
    expect(calls.map((c) => c.phoneNumber)).toEqual([
      '*123#',
      '0241234567',
      '0205559870',
    ]);
    expect(calls[0]).toEqual({
      id: expect.any(String),
      phoneNumber: '*123#',
      callType: 'outgoing',
      duration: 42,
      calledAt: '2026-11-01T10:00:00.000Z',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('filters by type and limits the count', async () => {
    expect((await list(alice, '?type=missed')).map((c) => c.callType)).toEqual([
      'missed',
    ]);
    expect(await list(alice, '?limit=1')).toHaveLength(1);
    await api(app, alice).get('/api/calls?type=voicemail').expect(400);
    await api(app, alice).get('/api/calls?limit=0').expect(400);
  });

  it('filters by number in any formatting (contact detail page)', async () => {
    const calls = await list(
      alice,
      `?phone=${encodeURIComponent('024 123 4567')}`,
    );
    expect(calls.map((c) => c.phoneNumber)).toEqual(['0241234567']);
    await api(app, alice).get('/api/calls?phone=call-me').expect(400);
  });

  it('deletes a grouped Recents row in one request', async () => {
    const extra = await record(alice, {
      phoneNumber: '0559993333',
      callType: 'missed',
    }).expect(201);
    const extra2 = await record(alice, {
      phoneNumber: '0559993333',
      callType: 'missed',
    }).expect(201);
    const ids = [extra, extra2].map((r) => (r.body as ApiCall).id);

    // Another user's ids are ignored, not deleted.
    const byBob = await api(app, bob)
      .post('/api/calls/bulk-delete')
      .send({ ids })
      .expect(200);
    expect(byBob.body).toEqual({ deleted: 0 });

    const res = await api(app, alice)
      .post('/api/calls/bulk-delete')
      .send({ ids })
      .expect(200);
    expect(res.body).toEqual({ deleted: 2 });
    expect((await list(alice)).map((c) => c.id)).not.toContain(ids[0]);

    await api(app, alice)
      .post('/api/calls/bulk-delete')
      .send({ ids: [] })
      .expect(400);
    await api(app, alice)
      .post('/api/calls/bulk-delete')
      .send({ ids: ['not-an-id'] })
      .expect(400);
  });

  it('validates new entries', async () => {
    await record(alice, {
      phoneNumber: 'call me',
      callType: 'outgoing',
    }).expect(400);
    await record(alice, {
      phoneNumber: '0241234567',
      callType: 'dropped',
    }).expect(400);
    await record(alice, {
      phoneNumber: '0241234567',
      callType: 'outgoing',
      duration: -5,
    }).expect(400);
  });

  it("keeps each user's history private", async () => {
    expect(await list(bob)).toEqual([]);
    const [aliceCall] = await list(alice);
    await api(app, bob).delete(`/api/calls/${aliceCall.id}`).expect(404);
  });

  it('deletes one entry, then clears the rest', async () => {
    const [first] = await list(alice);
    await api(app, alice).delete(`/api/calls/${first.id}`).expect(204);
    expect(await list(alice)).toHaveLength(2);

    await api(app, alice).delete('/api/calls').expect(204);
    expect(await list(alice)).toEqual([]);
  });

  it('serves the free STUN servers for in-app calls', async () => {
    const res = await api(app, alice).get('/api/calls/ice-servers').expect(200);
    expect(res.body).toEqual([
      {
        urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
      },
    ]);
  });
});
