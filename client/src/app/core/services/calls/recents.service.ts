import { Injectable, computed, effect, signal } from '@angular/core';
import { CallRecord } from './call.model';
import { loadJson, saveJson } from '../../utils/storage';

const STORAGE_KEY = 'dialer.recents';

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

// Demo history shown on first run, until the calls API is wired up.
const SEED_CALLS: CallRecord[] = [
  { id: 'seed-1', phoneNumber: '0241234567', callType: 'missed', duration: 0, calledAt: hoursAgo(0.05) },
  { id: 'seed-2', phoneNumber: '0205559870', callType: 'incoming', duration: 312, calledAt: hoursAgo(0.2) },
  { id: 'seed-3', phoneNumber: '0277778888', callType: 'outgoing', duration: 95, calledAt: hoursAgo(1) },
  { id: 'seed-4', phoneNumber: '0559993333', callType: 'missed', duration: 0, calledAt: hoursAgo(26) },
  { id: 'seed-5', phoneNumber: '0559993333', callType: 'missed', duration: 0, calledAt: hoursAgo(26.5) },
  { id: 'seed-6', phoneNumber: '0559993333', callType: 'missed', duration: 0, calledAt: hoursAgo(27) },
  { id: 'seed-7', phoneNumber: '0302111222', callType: 'outgoing', duration: 41, calledAt: hoursAgo(72) },
];

@Injectable({
  providedIn: 'root',
})
export class RecentsService {
  /** Newest first. */
  #calls = signal<CallRecord[]>(loadJson(STORAGE_KEY, SEED_CALLS));

  calls = this.#calls.asReadonly();

  /** Used to redial when the call button is pressed with nothing typed. */
  lastDialed = computed(() => this.#calls().find((c) => c.callType === 'outgoing')?.phoneNumber ?? '');

  constructor() {
    effect(() => saveJson(STORAGE_KEY, this.#calls()));
  }

  add(record: Omit<CallRecord, 'id'>): void {
    this.#calls.update((list) => [{ ...record, id: crypto.randomUUID() }, ...list]);
  }

  remove(ids: string[]): void {
    this.#calls.update((list) => list.filter((c) => !ids.includes(c.id)));
  }

  clear(): void {
    this.#calls.set([]);
  }
}
