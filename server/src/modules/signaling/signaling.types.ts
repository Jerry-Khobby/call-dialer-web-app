// Messages exchanged on the /calls socket.io namespace to set up a browser-to-browser
// (WebRTC) call. The server only relays them: audio flows directly between the browsers.
//
// Caller                         Server                          Callee (every open tab)
//   call:start {to, offer} ────▶ looks up `to`, rings ─────────▶ call:incoming {callId, from, offer}
//   ◀── ack {ok, callId} / {ok:false, reason}
//   call:answered {answer} ◀──── relays ◀──────────────────────── call:answer {callId, answer}
//   call:ice ◀──────────────────▶ relays ◀──────────────────────▶ call:ice {callId, candidate}
//   call:end / call:reject ─────▶ call:ended {callId, reason} to both, logs to both histories

/** Who is behind a socket; set once the handshake token is verified. */
export type SocketUser = {
  userId: string;
  phoneNumber: string;
  fullName: string;
};

export type EndReason =
  | 'hangup' // Either side ended a connected call
  | 'cancelled' // Caller gave up before it was answered
  | 'rejected' // Callee declined
  | 'no-answer' // Rang for too long
  | 'disconnected' // A party's connection dropped
  | 'answered-elsewhere'; // Callee picked up in another tab

export type CallAck =
  | { ok: true; callId?: string }
  | {
      ok: false;
      reason:
        | 'invalid'
        | 'not-registered'
        | 'self'
        | 'offline'
        | 'busy'
        | 'in-call'
        | 'unknown-call'
        | 'rate-limited';
    };

export type CallSession = {
  id: string;
  caller: SocketUser & { socketId: string };
  /** socketId is only known once one of the callee's tabs answers. */
  callee: SocketUser & { socketId?: string };
  startedAt: Date;
  answeredAt?: Date;
  ringTimer: ReturnType<typeof setTimeout>;
};
