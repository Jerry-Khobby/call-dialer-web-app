// Mirrors the API's Call (server/src/modules/calls). The name shown comes from the user's
// contacts when the number is saved there, so renaming a contact updates its history.
export type CallType = 'outgoing' | 'incoming' | 'missed';

export type CallRecord = {
  id: string;
  phoneNumber: string;
  callType: CallType;
  duration: number; // seconds
  calledAt: string; // ISO date
  /** For in-app calls: the other person's account name, shown like caller ID. */
  contactName?: string;
};

export type CallStatus =
  | 'dialing' // Getting the microphone and reaching the other person
  | 'ringing' // Their phone is ringing
  | 'incoming' // Someone is calling you
  | 'connecting' // Answered; setting up the audio between the two browsers
  | 'connected'
  | 'unavailable' // The number isn't on Dialer: offer the phone's own dialer instead
  | 'ended';

export type ActiveCall = {
  /** The server's id for the call, once it is known. */
  id: string | null;
  direction: 'outgoing' | 'incoming';
  phoneNumber: string;
  /** Incoming calls: the caller's Dialer name. */
  callerName?: string;
  status: CallStatus;
  dialedAt: number;
  connectedAt: number | null;
  muted: boolean;
  tones: string; // digits pressed on the in-call keypad
  /** Why the call ended or can't go through, e.g. "Busy" or "No answer". */
  message?: string;
};

/** Messages exchanged with the server's /calls socket (server/src/modules/signaling). */
export type CallAck =
  | { ok: true; callId?: string }
  | {
      ok: false;
      reason: 'invalid' | 'not-registered' | 'self' | 'offline' | 'busy' | 'in-call' | 'unknown-call';
    };

export type IncomingCall = {
  callId: string;
  from: { phoneNumber: string; fullName: string };
  offer: RTCSessionDescriptionInit;
};

export type EndReason =
  | 'hangup'
  | 'cancelled'
  | 'rejected'
  | 'no-answer'
  | 'disconnected'
  | 'answered-elsewhere';
