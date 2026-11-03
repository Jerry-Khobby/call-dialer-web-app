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
