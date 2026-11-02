// Mirrors the server's Call schema (minus userId). The contact name is looked up
// from ContactService when displayed, so renaming a contact updates its history.
export type CallType = 'outgoing' | 'incoming' | 'missed';

export type CallRecord = {
  id: string;
  phoneNumber: string;
  callType: CallType;
  duration: number; // seconds
  calledAt: string; // ISO date
};

export type CallStatus = 'dialing' | 'ringing' | 'connected' | 'ended';

export type ActiveCall = {
  phoneNumber: string;
  status: CallStatus;
  dialedAt: number;
  connectedAt: number | null;
  muted: boolean;
  speaker: boolean;
  tones: string; // digits pressed on the in-call keypad
};
