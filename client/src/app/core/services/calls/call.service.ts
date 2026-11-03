import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { API } from '../../api/api';
import { ActiveCall, CallAck, EndReason, IncomingCall } from './call.model';
import { RecentsService } from './recents.service';
import { Ringer } from './ringer';

/** A problem worth telling the user about, e.g. "Busy" or a blocked microphone. */
class CallProblem extends Error {}

const ACK_TIMEOUT_MS = 10_000;

/** Used if the server's STUN/TURN list can't be fetched. Google's public STUN is free. */
const FALLBACK_ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

type Unreachable = Extract<CallAck, { ok: false }>['reason'];

const UNREACHABLE: Record<Unreachable, string> = {
  'not-registered': "This number isn't on Dialer.",
  offline: 'Not available right now',
  busy: 'Busy',
  self: "You can't call your own number",
  'in-call': "You're already in a call",
  invalid: "Couldn't place the call",
  'unknown-call': 'The call has already ended',
};

const ENDED: Record<EndReason, string> = {
  hangup: 'Call ended',
  cancelled: 'Call cancelled',
  rejected: 'Declined',
  'no-answer': 'No answer',
  disconnected: 'Call dropped',
  'answered-elsewhere': 'Answered on another device',
};

/**
 * Owns the call in progress. Calls are free browser-to-browser (WebRTC) audio between
 * Dialer users: the server's /calls socket only relays the set-up messages, and the
 * audio flows directly between the two browsers. The UI only reads `call` and `elapsed`.
 */
@Injectable({
  providedIn: 'root',
})
export class CallService {
  #router = inject(Router);
  #http = inject(HttpClient);
  #recents = inject(RecentsService);

  #call = signal<ActiveCall | null>(null);
  #now = signal(Date.now());
  #clock?: ReturnType<typeof setInterval>;
  #closeTimer?: ReturnType<typeof setTimeout>;
  #returnUrl = '/keypad';

  #socket?: Socket;
  #iceServers?: RTCIceServer[];
  #peer?: RTCPeerConnection;
  #microphone?: MediaStream;
  #remoteAudio = new Audio();
  #ringer = new Ringer();
  /** An incoming call's offer, kept until it is answered. */
  #offer?: RTCSessionDescriptionInit;
  /** Our network candidates found before the server gave the call an id. */
  #outgoingIce: RTCIceCandidateInit[] = [];
  /** The other side's candidates that arrived before we were ready for them. */
  #incomingIce: RTCIceCandidateInit[] = [];

  call = this.#call.asReadonly();

  /** Seconds since the audio connected. */
  elapsed = computed(() => {
    const connectedAt = this.#call()?.connectedAt;
    return connectedAt ? Math.max(0, Math.floor((this.#now() - connectedAt) / 1000)) : 0;
  });

  constructor() {
    this.#remoteAudio.autoplay = true;
  }

  /** Opens the signalling socket for the signed-in user; called on login. */
  connect(token: string): void {
    this.disconnect();
    const socket = io('/calls', { auth: { token } });
    socket.on('call:incoming', (call: IncomingCall) => this.#onIncoming(call));
    socket.on('call:answered', (e: { callId: string; answer: RTCSessionDescriptionInit }) =>
      void this.#onAnswered(e.callId, e.answer),
    );
    socket.on('call:ice', (e: { callId: string; candidate: RTCIceCandidateInit }) =>
      this.#onRemoteIce(e.callId, e.candidate),
    );
    socket.on('call:ended', (e: { callId: string; reason: EndReason }) =>
      this.#onEnded(e.callId, e.reason),
    );
    this.#socket = socket;
  }

  /** Closes the socket and drops any call; called on logout. */
  disconnect(): void {
    if (this.#call()) this.#finish(undefined, true);
    this.#socket?.disconnect();
    this.#socket = undefined;
    this.#iceServers = undefined;
  }

  async dial(phoneNumber: string): Promise<void> {
    if (this.#call()) return; // one call at a time
    this.#begin({ direction: 'outgoing', phoneNumber, status: 'dialing' });

    try {
      const socket = this.#connectedSocket();
      const peer = await this.#createPeer();
      if (this.#call()?.status !== 'dialing') return this.#release(); // Hung up meanwhile
      await peer.setLocalDescription(await peer.createOffer());
      const ack = (await socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck('call:start', { to: phoneNumber, offer: peer.localDescription?.toJSON() })) as CallAck;

      // Hung up while we were waiting for the server.
      if (this.#call()?.status !== 'dialing') {
        if (ack.ok && ack.callId) socket.emit('call:end', { callId: ack.callId });
        return;
      }
      if (!ack.ok) {
        if (ack.reason === 'not-registered') this.#offerPhoneDialer();
        else this.#finish(UNREACHABLE[ack.reason]);
        return;
      }

      this.#patch({ id: ack.callId ?? null, status: 'ringing' });
      this.#ringer.start(0.03); // ringback
      this.#outgoingIce.splice(0).forEach((candidate) => this.#sendIce(candidate));
    } catch (error) {
      this.#fail(error);
    }
  }

  /** Answers an incoming call. */
  async accept(): Promise<void> {
    const call = this.#call();
    if (call?.status !== 'incoming' || !call.id || !this.#offer) return;
    this.#ringer.stop();
    this.#patch({ status: 'connecting' });

    try {
      const socket = this.#connectedSocket();
      const offer = this.#offer;
      const peer = await this.#createPeer();
      if (this.#call()?.status !== 'connecting') return this.#release(); // Ended meanwhile
      await peer.setRemoteDescription(offer);
      this.#drainIncomingIce();
      await peer.setLocalDescription(await peer.createAnswer());
      const ack = (await socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck('call:answer', { callId: call.id, answer: peer.localDescription?.toJSON() })) as CallAck;
      if (!ack.ok) throw new CallProblem(UNREACHABLE[ack.reason]);
    } catch (error) {
      this.#fail(error);
    }
  }

  /** Declines an incoming call; the caller sees "Declined". */
  decline(): void {
    const call = this.#call();
    if (call?.status !== 'incoming') return;
    if (call.id) this.#socket?.emit('call:reject', { callId: call.id });
    this.#finish('Declined');
  }

  hangUp(): void {
    const call = this.#call();
    if (!call || call.status === 'ended') return;
    if (call.status === 'incoming') return this.decline();
    if (call.id) this.#socket?.emit('call:end', { callId: call.id });
    this.#finish(call.status === 'unavailable' ? undefined : 'Call ended');
  }

  /** For numbers that aren't on Dialer: hands the call to the device's own phone app. */
  callWithPhone(): void {
    const call = this.#call();
    if (call?.status !== 'unavailable') return;
    window.location.href = `tel:${call.phoneNumber}`;
    this.#recents
      .add({
        phoneNumber: call.phoneNumber,
        callType: 'outgoing',
        duration: 0,
        calledAt: new Date(call.dialedAt).toISOString(),
      })
      .catch(() => undefined); // History is a convenience; the hand-off already happened
    this.#finish('Opened your phone app');
  }

  toggleMute(): void {
    const muted = !this.#call()?.muted;
    this.#microphone?.getAudioTracks().forEach((track) => (track.enabled = !muted));
    this.#patch({ muted });
  }

  /** In-call keypad press, sent to the other side as a DTMF tone ("press 1 for…"). */
  sendTone(digit: string): void {
    const call = this.#call();
    if (call?.status !== 'connected') return;
    const tone = digit === '+' ? '0' : digit; // "+" isn't a DTMF tone; holding 0 still sends 0
    try {
      this.#peer
        ?.getSenders()
        .find((sender) => sender.track?.kind === 'audio')
        ?.dtmf?.insertDTMF(tone);
    } catch {
      // Tones are best-effort; the digit is still shown.
    }
    this.#patch({ tones: call.tones + tone });
  }

  // ---- Signalling events ----------------------------------------------------------

  #onIncoming({ callId, from, offer }: IncomingCall): void {
    if (this.#call()) {
      this.#socket?.emit('call:reject', { callId }); // Already on a call
      return;
    }
    this.#offer = offer;
    this.#begin({
      id: callId,
      direction: 'incoming',
      phoneNumber: from.phoneNumber,
      callerName: from.fullName,
      status: 'incoming',
    });
    this.#ringer.start();
  }

  async #onAnswered(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    if (this.#call()?.id !== callId || !this.#peer) return;
    this.#ringer.stop();
    this.#patch({ status: 'connecting' });
    try {
      await this.#peer.setRemoteDescription(answer);
      this.#drainIncomingIce();
    } catch (error) {
      this.#fail(error);
    }
  }

  #onRemoteIce(callId: string, candidate: RTCIceCandidateInit): void {
    if (this.#call()?.id !== callId) return;
    if (this.#peer?.remoteDescription) {
      this.#peer.addIceCandidate(candidate).catch(() => undefined);
    } else {
      this.#incomingIce.push(candidate);
    }
  }

  #onEnded(callId: string, reason: EndReason): void {
    const call = this.#call();
    if (call?.id !== callId) return;
    // The person being called sees a missed call when the caller gives up or it rings out.
    const missed =
      call.direction === 'incoming' && (reason === 'cancelled' || reason === 'no-answer');
    this.#finish(missed ? 'Missed call' : ENDED[reason], reason === 'answered-elsewhere');
  }

  // ---- WebRTC ---------------------------------------------------------------------

  /** Microphone + peer connection, wired to send candidates and play the other side. */
  async #createPeer(): Promise<RTCPeerConnection> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new CallProblem('Calls need a secure page (https or localhost).');
    }
    try {
      this.#microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      throw new CallProblem('Allow microphone access to make calls.');
    }

    const peer = new RTCPeerConnection({ iceServers: await this.#loadIceServers() });
    this.#microphone.getAudioTracks().forEach((track) => peer.addTrack(track, this.#microphone!));
    peer.onicecandidate = ({ candidate }) => {
      if (candidate) this.#sendIce(candidate.toJSON());
    };
    peer.ontrack = ({ streams }) => {
      this.#remoteAudio.srcObject = streams[0];
      this.#remoteAudio.play().catch(() => undefined);
    };
    peer.onconnectionstatechange = () => {
      if (peer !== this.#peer) return;
      if (peer.connectionState === 'connected' && this.#call()?.status === 'connecting') {
        this.#now.set(Date.now());
        this.#patch({ status: 'connected', connectedAt: Date.now() });
        this.#clock = setInterval(() => this.#now.set(Date.now()), 1000);
      } else if (peer.connectionState === 'failed') {
        this.#fail(
          new CallProblem("Couldn't connect the audio. A firewall may be blocking the call."),
        );
      }
    };
    this.#peer = peer;
    return peer;
  }

  async #loadIceServers(): Promise<RTCIceServer[]> {
    this.#iceServers ??= await firstValueFrom(
      this.#http.get<RTCIceServer[]>(`${API}/calls/ice-servers`),
    ).catch(() => FALLBACK_ICE_SERVERS);
    return this.#iceServers;
  }

  #sendIce(candidate: RTCIceCandidateInit): void {
    const callId = this.#call()?.id;
    if (callId) this.#socket?.emit('call:ice', { callId, candidate });
    else this.#outgoingIce.push(candidate);
  }

  #drainIncomingIce(): void {
    for (const candidate of this.#incomingIce.splice(0)) {
      this.#peer?.addIceCandidate(candidate).catch(() => undefined);
    }
  }

  #connectedSocket(): Socket {
    if (!this.#socket?.connected) {
      throw new CallProblem("Can't reach Dialer right now. Check your connection.");
    }
    return this.#socket;
  }

  // ---- Call lifecycle -------------------------------------------------------------

  #begin(call: Pick<ActiveCall, 'direction' | 'phoneNumber' | 'status'> & Partial<ActiveCall>): void {
    clearTimeout(this.#closeTimer);
    this.#returnUrl = this.#router.url.startsWith('/call') ? '/keypad' : this.#router.url;
    this.#call.set({
      id: null,
      dialedAt: Date.now(),
      connectedAt: null,
      muted: false,
      tones: '',
      ...call,
    });
    this.#router.navigate(['/call']);
  }

  /** Not on Dialer: release the microphone and offer the phone's own dialer. */
  #offerPhoneDialer(): void {
    this.#release();
    this.#patch({ status: 'unavailable', message: UNREACHABLE['not-registered'] });
  }

  #fail(error: unknown): void {
    const callId = this.#call()?.id;
    if (callId) this.#socket?.emit('call:end', { callId });
    this.#finish(error instanceof CallProblem ? error.message : "Couldn't place the call");
  }

  /**
   * Ends the call locally. Shows `message` briefly, like a phone does, then goes back to
   * where the call started; `silent` skips that (e.g. answered on another device).
   */
  #finish(message?: string, silent = false): void {
    const status = this.#call()?.status;
    if (!status || status === 'ended') return;
    this.#release();
    clearInterval(this.#clock);
    this.#recents.load().catch(() => undefined); // The server has recorded this call

    if (silent || !message) {
      this.#close();
      return;
    }
    this.#patch({ status: 'ended', message });
    clearTimeout(this.#closeTimer);
    this.#closeTimer = setTimeout(() => this.#close(), 1500);
  }

  #close(): void {
    this.#call.set(null);
    this.#router.navigateByUrl(this.#returnUrl);
  }

  /** Stops the microphone, ringing and audio, and closes the peer connection. */
  #release(): void {
    this.#ringer.stop();
    this.#microphone?.getTracks().forEach((track) => track.stop());
    this.#microphone = undefined;
    this.#peer?.close();
    this.#peer = undefined;
    this.#remoteAudio.srcObject = null;
    this.#offer = undefined;
    this.#outgoingIce = [];
    this.#incomingIce = [];
  }

  #patch(changes: Partial<ActiveCall>): void {
    this.#call.update((call) => (call ? { ...call, ...changes } : call));
  }
}
