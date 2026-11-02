import { INestApplication } from '@nestjs/common';
import { Socket } from 'socket.io-client';
import { App } from 'supertest/types';
import { CallsGateway } from '../src/modules/signaling/calls.gateway';
import {
  api,
  connectSocket,
  createTestApp,
  nextEvent,
  registerUser,
  TestUser,
} from './utils';

type Ack = { ok: boolean; callId?: string; reason?: string };
type Incoming = {
  callId: string;
  from: { phoneNumber: string; fullName: string };
  offer: unknown;
};
type Ended = { callId: string; reason: string };
type ApiCall = { phoneNumber: string; callType: string; duration: number };

const OFFER = { type: 'offer', sdp: 'v=0 fake-offer' };
const ANSWER = { type: 'answer', sdp: 'v=0 fake-answer' };

describe('Call signaling (e2e)', () => {
  let app: INestApplication<App>;
  let alice: TestUser;
  let bob: TestUser;
  let carol: TestUser;
  const sockets: Socket[] = [];

  const connect = async (user: TestUser) => {
    const socket = await connectSocket(app, user.token);
    sockets.push(socket);
    return socket;
  };
  const send = (socket: Socket, event: string, body: object) =>
    socket.timeout(3000).emitWithAck(event, body) as Promise<Ack>;
  const history = async (user: TestUser) =>
    (await api(app, user).get('/api/calls').expect(200)).body as ApiCall[];

  beforeAll(async () => {
    app = await createTestApp();
    alice = await registerUser(app, {
      fullName: 'Alice',
      phoneNumber: '0241111111',
    });
    bob = await registerUser(app, {
      fullName: 'Bob',
      phoneNumber: '0242222222',
    });
    carol = await registerUser(app, {
      fullName: 'Carol',
      phoneNumber: '0243333333',
    });
  });

  afterEach(async () => {
    sockets.splice(0).forEach((s) => s.disconnect());
    await api(app, alice).delete('/api/calls');
    await api(app, bob).delete('/api/calls');
    await api(app, carol).delete('/api/calls');
  });

  afterAll(async () => {
    await app.close();
  });

  it('refuses sockets without a valid token', async () => {
    await expect(connectSocket(app, '')).rejects.toThrow('Unauthorized');
    await expect(connectSocket(app, 'forged.token.value')).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('connects a call end to end and logs it for both people', async () => {
    const a = await connect(alice);
    const b = await connect(bob);

    // Alice dials Bob's number, formatted differently from how he registered it.
    const incoming = nextEvent<Incoming>(b, 'call:incoming');
    const started = await send(a, 'call:start', {
      to: '024 222 2222',
      offer: OFFER,
    });
    expect(started).toEqual({ ok: true, callId: expect.any(String) });
    const callId = started.callId!;

    expect(await incoming).toEqual({
      callId,
      from: { phoneNumber: '0241111111', fullName: 'Alice' },
      offer: OFFER,
    });

    // Bob answers; Alice gets his SDP answer.
    const answered = nextEvent(a, 'call:answered');
    expect(await send(b, 'call:answer', { callId, answer: ANSWER })).toEqual({
      ok: true,
    });
    expect(await answered).toEqual({ callId, answer: ANSWER });

    // ICE candidates are relayed both ways.
    const toBob = nextEvent(b, 'call:ice');
    await send(a, 'call:ice', {
      callId,
      candidate: { candidate: 'from-alice' },
    });
    expect(await toBob).toEqual({
      callId,
      candidate: { candidate: 'from-alice' },
    });

    const toAlice = nextEvent(a, 'call:ice');
    await send(b, 'call:ice', { callId, candidate: { candidate: 'from-bob' } });
    expect(await toAlice).toEqual({
      callId,
      candidate: { candidate: 'from-bob' },
    });

    // Alice hangs up.
    const ended = nextEvent<Ended>(b, 'call:ended');
    expect(await send(a, 'call:end', { callId })).toEqual({ ok: true });
    expect(await ended).toEqual({ callId, reason: 'hangup' });

    expect(await history(alice)).toEqual([
      expect.objectContaining({
        phoneNumber: '0242222222',
        callType: 'outgoing',
      }),
    ]);
    expect(await history(bob)).toEqual([
      expect.objectContaining({
        phoneNumber: '0241111111',
        callType: 'incoming',
      }),
    ]);
  });

  it('reports numbers that cannot be reached in the app', async () => {
    const a = await connect(alice);

    expect(
      await send(a, 'call:start', { to: '0209999999', offer: OFFER }),
    ).toEqual({
      ok: false,
      reason: 'not-registered',
    });
    expect(
      await send(a, 'call:start', { to: '0241111111', offer: OFFER }),
    ).toEqual({
      ok: false,
      reason: 'self',
    });
    expect(await send(a, 'call:start', { to: '0242222222' })).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it('logs a missed call when the callee is offline', async () => {
    const a = await connect(alice);

    expect(
      await send(a, 'call:start', { to: '0242222222', offer: OFFER }),
    ).toEqual({
      ok: false,
      reason: 'offline',
    });
    expect(await history(bob)).toEqual([
      expect.objectContaining({
        phoneNumber: '0241111111',
        callType: 'missed',
        duration: 0,
      }),
    ]);
  });

  it('treats a declined call as missed for the callee', async () => {
    const a = await connect(alice);
    const b = await connect(bob);

    const incoming = nextEvent<Incoming>(b, 'call:incoming');
    await send(a, 'call:start', { to: '0242222222', offer: OFFER });
    const { callId } = await incoming;

    const ended = nextEvent<Ended>(a, 'call:ended');
    expect(await send(b, 'call:reject', { callId })).toEqual({ ok: true });
    expect(await ended).toEqual({ callId, reason: 'rejected' });
    expect((await history(bob))[0]).toMatchObject({ callType: 'missed' });
  });

  it('lets the caller cancel while it is still ringing', async () => {
    const a = await connect(alice);
    const b = await connect(bob);

    const incoming = nextEvent<Incoming>(b, 'call:incoming');
    await send(a, 'call:start', { to: '0242222222', offer: OFFER });
    const { callId } = await incoming;

    const ended = nextEvent<Ended>(b, 'call:ended');
    await send(a, 'call:end', { callId });
    expect(await ended).toEqual({ callId, reason: 'cancelled' });
  });

  it('says the callee is busy while they are on another call', async () => {
    const a = await connect(alice);
    const b = await connect(bob);
    const c = await connect(carol);

    const incoming = nextEvent<Incoming>(b, 'call:incoming');
    await send(a, 'call:start', { to: '0242222222', offer: OFFER });
    await incoming;

    expect(
      await send(c, 'call:start', { to: '0242222222', offer: OFFER }),
    ).toEqual({
      ok: false,
      reason: 'busy',
    });
    expect(
      await send(a, 'call:start', { to: '0243333333', offer: OFFER }),
    ).toEqual({
      ok: false,
      reason: 'in-call',
    });
  });

  it('stops ringing after the timeout and logs a missed call', async () => {
    app.get(CallsGateway).ringTimeoutMs = 300;
    try {
      const a = await connect(alice);
      const b = await connect(bob);

      const ringing = nextEvent<Incoming>(b, 'call:incoming');
      await send(a, 'call:start', { to: '0242222222', offer: OFFER });
      const { callId } = await ringing;

      expect(await nextEvent<Ended>(a, 'call:ended')).toEqual({
        callId,
        reason: 'no-answer',
      });
      expect((await history(bob))[0]).toMatchObject({ callType: 'missed' });
    } finally {
      app.get(CallsGateway).ringTimeoutMs = 30_000;
    }
  });

  it('rings every open tab and stops the others when one answers', async () => {
    const a = await connect(alice);
    const bTab1 = await connect(bob);
    const bTab2 = await connect(bob);

    const ring1 = nextEvent<Incoming>(bTab1, 'call:incoming');
    const ring2 = nextEvent<Incoming>(bTab2, 'call:incoming');
    await send(a, 'call:start', { to: '0242222222', offer: OFFER });
    const { callId } = await ring1;
    await ring2;

    const tab2Ended = nextEvent<Ended>(bTab2, 'call:ended');
    await send(bTab1, 'call:answer', { callId, answer: ANSWER });
    expect(await tab2Ended).toEqual({ callId, reason: 'answered-elsewhere' });

    // The other tab can no longer answer it.
    expect(
      await send(bTab2, 'call:answer', { callId, answer: ANSWER }),
    ).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it('ends the call when a connected party drops', async () => {
    const a = await connect(alice);
    const b = await connect(bob);

    const incoming = nextEvent<Incoming>(b, 'call:incoming');
    await send(a, 'call:start', { to: '0242222222', offer: OFFER });
    const { callId } = await incoming;
    await send(b, 'call:answer', { callId, answer: ANSWER });

    const ended = nextEvent<Ended>(a, 'call:ended');
    b.disconnect();
    expect(await ended).toEqual({ callId, reason: 'disconnected' });
    expect((await history(bob))[0]).toMatchObject({ callType: 'incoming' });
  });

  it("ignores messages about calls the user isn't part of", async () => {
    const a = await connect(alice);
    const b = await connect(bob);
    const c = await connect(carol);

    const incoming = nextEvent<Incoming>(b, 'call:incoming');
    await send(a, 'call:start', { to: '0242222222', offer: OFFER });
    const { callId } = await incoming;

    for (const event of [
      'call:answer',
      'call:ice',
      'call:reject',
      'call:end',
    ]) {
      expect(
        await send(c, event, { callId, answer: ANSWER, candidate: {} }),
      ).toEqual({ ok: false, reason: 'unknown-call' });
    }
  });
});
