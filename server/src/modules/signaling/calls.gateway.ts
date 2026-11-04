import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { randomUUID } from 'node:crypto';
import { Namespace, Socket } from 'socket.io';
import { JwtPayload } from '../auth/auth.types';
import { phoneDigits } from '../../common/phone';
import { CallsService } from '../calls/calls.service';
import { UsersService } from '../users/users.service';
import type {
  CallAck,
  CallSession,
  EndReason,
  SocketUser,
} from './signaling.types';

/** How long an unanswered call rings before it counts as missed. */
export const RING_TIMEOUT_MS = 30_000;

/**
 * Calls one person may start per minute. Every attempt, answered or not, can leave a
 * missed call in someone's Recents, so this stops a script from flooding a number.
 */
export const CALLS_PER_MINUTE = 10;

type CallSocket = Socket<any, any, any, SocketUser>;

const userRoom = (userId: string) => `user:${userId}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Signaling for free, in-app calls between registered users. Sockets authenticate with the
 * same JWT as the REST API: `io('/calls', { auth: { token } })`.
 */
@WebSocketGateway({ namespace: '/calls' })
export class CallsGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer() private server: Namespace;

  private readonly logger = new Logger(CallsGateway.name);
  private readonly sessions = new Map<string, CallSession>();
  /** When each user started their recent calls, for the per-minute limit. */
  private readonly callStarts = new Map<string, number[]>();

  /** Shortened by the e2e tests. */
  ringTimeoutMs = RING_TIMEOUT_MS;

  /** Raised by the e2e tests, which start many calls a minute. */
  callsPerMinute = CALLS_PER_MINUTE;

  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly calls: CallsService,
  ) {}

  afterInit(server: Namespace) {
    // Reject the handshake itself, so no event can arrive from an unauthenticated socket.
    server.use((socket: CallSocket, next) => {
      this.authenticate(socket).then(
        () => next(),
        () => next(new Error('Unauthorized')),
      );
    });
  }

  private async authenticate(socket: CallSocket): Promise<void> {
    const auth: unknown = socket.handshake.auth;
    const token =
      isRecord(auth) && typeof auth.token === 'string' ? auth.token : '';
    const { sub } = await this.jwt.verifyAsync<JwtPayload>(token);
    const user = await this.users.findById(sub);
    if (!user) throw new Error('Account no longer exists');

    socket.data = {
      userId: user._id.toString(),
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
    };
    await socket.join(userRoom(user._id.toString()));
  }

  @SubscribeMessage('call:start')
  async start(
    @ConnectedSocket() socket: CallSocket,
    @MessageBody() body: unknown,
  ): Promise<CallAck> {
    if (
      !isRecord(body) ||
      typeof body.to !== 'string' ||
      !phoneDigits(body.to) ||
      !body.offer
    ) {
      return { ok: false, reason: 'invalid' };
    }
    const caller = socket.data;
    if (this.inCall(caller.userId)) return { ok: false, reason: 'in-call' };
    if (!this.allowCallStart(caller.userId)) {
      return { ok: false, reason: 'rate-limited' };
    }

    const callee = await this.users.findByPhone(body.to);
    if (!callee) return { ok: false, reason: 'not-registered' };
    const calleeId = callee._id.toString();
    if (calleeId === caller.userId) return { ok: false, reason: 'self' };

    const calleeUser: SocketUser = {
      userId: calleeId,
      phoneNumber: callee.phoneNumber,
      fullName: callee.fullName,
    };
    const online =
      (await this.server.in(userRoom(calleeId)).fetchSockets()).length > 0;
    const busy = this.inCall(calleeId);
    if (!online || busy) {
      // The callee still sees a missed call, like on a phone.
      await this.log({ caller, callee: calleeUser, startedAt: new Date() });
      return { ok: false, reason: online ? 'busy' : 'offline' };
    }

    const session: CallSession = {
      id: randomUUID(),
      caller: { ...caller, socketId: socket.id },
      callee: calleeUser,
      startedAt: new Date(),
      ringTimer: setTimeout(
        () => void this.end(session, 'no-answer'),
        this.ringTimeoutMs,
      ),
    };
    this.sessions.set(session.id, session);

    this.server.to(userRoom(calleeId)).emit('call:incoming', {
      callId: session.id,
      from: { phoneNumber: caller.phoneNumber, fullName: caller.fullName },
      offer: body.offer,
    });
    return { ok: true, callId: session.id };
  }

  @SubscribeMessage('call:answer')
  answer(
    @ConnectedSocket() socket: CallSocket,
    @MessageBody() body: unknown,
  ): CallAck {
    const session = this.sessionFor(socket, body);
    if (!session || !isRecord(body) || !body.answer)
      return { ok: false, reason: 'unknown-call' };
    if (session.callee.userId !== socket.data.userId || session.answeredAt) {
      return { ok: false, reason: 'invalid' };
    }

    clearTimeout(session.ringTimer);
    session.answeredAt = new Date();
    session.callee.socketId = socket.id;

    this.server.to(session.caller.socketId).emit('call:answered', {
      callId: session.id,
      answer: body.answer,
    });
    // Stop the callee's other tabs from ringing.
    socket.to(userRoom(session.callee.userId)).emit('call:ended', {
      callId: session.id,
      reason: 'answered-elsewhere',
    });
    return { ok: true };
  }

  /** Network candidates found by either browser, relayed to the other side. */
  @SubscribeMessage('call:ice')
  ice(
    @ConnectedSocket() socket: CallSocket,
    @MessageBody() body: unknown,
  ): CallAck {
    const session = this.sessionFor(socket, body);
    if (!session || !isRecord(body) || !body.candidate)
      return { ok: false, reason: 'unknown-call' };

    const fromCaller = session.caller.socketId === socket.id;
    const target = fromCaller
      ? (session.callee.socketId ?? userRoom(session.callee.userId))
      : session.caller.socketId;
    this.server
      .to(target)
      .emit('call:ice', { callId: session.id, candidate: body.candidate });
    return { ok: true };
  }

  @SubscribeMessage('call:reject')
  async reject(
    @ConnectedSocket() socket: CallSocket,
    @MessageBody() body: unknown,
  ): Promise<CallAck> {
    const session = this.sessionFor(socket, body);
    if (
      !session ||
      session.callee.userId !== socket.data.userId ||
      session.answeredAt
    ) {
      return { ok: false, reason: 'unknown-call' };
    }
    await this.end(session, 'rejected');
    return { ok: true };
  }

  @SubscribeMessage('call:end')
  async hangUp(
    @ConnectedSocket() socket: CallSocket,
    @MessageBody() body: unknown,
  ): Promise<CallAck> {
    const session = this.sessionFor(socket, body);
    if (!session) return { ok: false, reason: 'unknown-call' };

    const byCaller = session.caller.socketId === socket.id;
    await this.end(
      session,
      session.answeredAt ? 'hangup' : byCaller ? 'cancelled' : 'rejected',
    );
    return { ok: true };
  }

  async handleDisconnect(socket: CallSocket) {
    for (const session of [...this.sessions.values()]) {
      if (
        session.caller.socketId === socket.id ||
        session.callee.socketId === socket.id
      ) {
        await this.end(session, 'disconnected');
      }
    }
  }

  /** The call `body.callId` refers to, if this socket's user is part of it. */
  private sessionFor(
    socket: CallSocket,
    body: unknown,
  ): CallSession | undefined {
    if (!isRecord(body) || typeof body.callId !== 'string') return undefined;
    const session = this.sessions.get(body.callId);
    const userId = socket.data.userId;
    return session &&
      (session.caller.userId === userId || session.callee.userId === userId)
      ? session
      : undefined;
  }

  /** Counts this attempt and says whether the user is still under the per-minute limit. */
  private allowCallStart(userId: string): boolean {
    const now = Date.now();
    const recent = (this.callStarts.get(userId) ?? []).filter(
      (at) => now - at < 60_000,
    );
    if (recent.length >= this.callsPerMinute) {
      this.callStarts.set(userId, recent);
      return false;
    }
    recent.push(now);
    this.callStarts.set(userId, recent);
    return true;
  }

  private inCall(userId: string): boolean {
    return [...this.sessions.values()].some(
      (s) => s.caller.userId === userId || s.callee.userId === userId,
    );
  }

  private async end(session: CallSession, reason: EndReason): Promise<void> {
    if (!this.sessions.delete(session.id)) return; // Already ended
    clearTimeout(session.ringTimer);

    // Save history first, so a client refreshing Recents on "call:ended" sees this call.
    await this.log(session);

    const ended = { callId: session.id, reason };
    this.server.to(session.caller.socketId).emit('call:ended', ended);
    this.server
      .to(session.callee.socketId ?? userRoom(session.callee.userId))
      .emit('call:ended', ended);
  }

  /** Writes the call to both parties' histories: outgoing for the caller, incoming or missed for the callee. */
  private async log(session: {
    caller: SocketUser;
    callee: SocketUser;
    startedAt: Date;
    answeredAt?: Date;
  }) {
    const duration = session.answeredAt
      ? Math.round((Date.now() - session.answeredAt.getTime()) / 1000)
      : 0;
    const calledAt = session.startedAt.toISOString();
    try {
      await Promise.all([
        this.calls.record(session.caller.userId, {
          phoneNumber: session.callee.phoneNumber,
          contactName: session.callee.fullName, // Caller ID, like a phone
          callType: 'outgoing',
          duration,
          calledAt,
        }),
        this.calls.record(session.callee.userId, {
          phoneNumber: session.caller.phoneNumber,
          contactName: session.caller.fullName,
          callType: session.answeredAt ? 'incoming' : 'missed',
          duration,
          calledAt,
        }),
      ]);
    } catch (error) {
      this.logger.error('Could not save call to history', error);
    }
  }
}
