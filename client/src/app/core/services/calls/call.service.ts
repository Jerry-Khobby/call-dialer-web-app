import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ActiveCall } from './call.model';
import { RecentsService } from './recents.service';

/**
 * Owns the call in progress. The UI only reads `call` and `elapsed`, so swapping the
 * simulated progress below for a real voice provider (e.g. Twilio Voice JS SDK) only
 * touches this file: start the provider call in `dial`, and drive `ringing` / `connected`
 * / `hangUp` from its events instead of timers.
 */
@Injectable({
  providedIn: 'root',
})
export class CallService {
  #router = inject(Router);
  #recents = inject(RecentsService);

  #call = signal<ActiveCall | null>(null);
  #now = signal(Date.now());
  #timers: ReturnType<typeof setTimeout>[] = [];
  #clock?: ReturnType<typeof setInterval>;
  #returnUrl = '/keypad';

  call = this.#call.asReadonly();

  /** Seconds since the call connected. */
  elapsed = computed(() => {
    const connectedAt = this.#call()?.connectedAt;
    return connectedAt ? Math.max(0, Math.floor((this.#now() - connectedAt) / 1000)) : 0;
  });

  dial(phoneNumber: string): void {
    if (this.#call()) return; // one call at a time

    this.#returnUrl = this.#router.url.startsWith('/call') ? '/keypad' : this.#router.url;
    this.#call.set({
      phoneNumber,
      status: 'dialing',
      dialedAt: Date.now(),
      connectedAt: null,
      muted: false,
      speaker: false,
      tones: '',
    });
    this.#router.navigate(['/call']);

    // Simulated call progress — replace with the voice provider's events.
    this.#after(1000, () => this.#patch({ status: 'ringing' }));
    this.#after(3500, () => {
      this.#now.set(Date.now());
      this.#patch({ status: 'connected', connectedAt: Date.now() });
      this.#clock = setInterval(() => this.#now.set(Date.now()), 1000);
    });
  }

  hangUp(): void {
    const call = this.#call();
    if (!call || call.status === 'ended') return;

    this.#stopTimers();
    this.#recents.add({
      phoneNumber: call.phoneNumber,
      callType: 'outgoing',
      duration: call.connectedAt ? Math.floor((Date.now() - call.connectedAt) / 1000) : 0,
      calledAt: new Date(call.dialedAt).toISOString(),
    });
    this.#patch({ status: 'ended' });

    // Leave "Call ended" on screen briefly, like a phone does.
    this.#after(1200, () => {
      this.#call.set(null);
      this.#router.navigateByUrl(this.#returnUrl);
    });
  }

  toggleMute(): void {
    this.#patch({ muted: !this.#call()?.muted });
  }

  toggleSpeaker(): void {
    this.#patch({ speaker: !this.#call()?.speaker });
  }

  /** In-call keypad press; a voice provider would send this as a DTMF tone. */
  sendTone(digit: string): void {
    const call = this.#call();
    if (call?.status === 'connected') this.#patch({ tones: call.tones + digit });
  }

  #patch(changes: Partial<ActiveCall>): void {
    this.#call.update((call) => (call ? { ...call, ...changes } : call));
  }

  #after(ms: number, fn: () => void): void {
    this.#timers.push(setTimeout(fn, ms));
  }

  #stopTimers(): void {
    this.#timers.forEach(clearTimeout);
    this.#timers = [];
    clearInterval(this.#clock);
  }
}
