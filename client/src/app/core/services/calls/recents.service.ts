import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API } from '../../api/api';
import { CallRecord } from './call.model';

/** How much history Recents shows (the server's maximum per request). */
const HISTORY_LIMIT = 500;

/** The signed-in user's call history, from the API. */
@Injectable({
  providedIn: 'root',
})
export class RecentsService {
  #http = inject(HttpClient);

  /** Newest first. */
  #calls = signal<CallRecord[]>([]);
  #loaded = signal(false);

  calls = this.#calls.asReadonly();
  loaded = this.#loaded.asReadonly();

  /** Used to redial when the call button is pressed with nothing typed. */
  lastDialed = computed(() => this.#calls().find((c) => c.callType === 'outgoing')?.phoneNumber ?? '');

  /** Fetches the history; called after login, and after each call (the server records those). */
  async load(): Promise<void> {
    this.#calls.set(
      await firstValueFrom(
        this.#http.get<CallRecord[]>(`${API}/calls`, { params: { limit: HISTORY_LIMIT } }),
      ),
    );
    this.#loaded.set(true);
  }

  /** Forgets everything, so the next account to log in never sees this history. */
  reset(): void {
    this.#calls.set([]);
    this.#loaded.set(false);
  }

  /** Records a call the server didn't see, e.g. one handed to the phone's own dialer. */
  async add(record: Omit<CallRecord, 'id'>): Promise<void> {
    const saved = await firstValueFrom(this.#http.post<CallRecord>(`${API}/calls`, record));
    this.#calls.update((list) => [saved, ...list]);
  }

  /** Deletes a grouped row's calls at once; restores the list if the server refuses. */
  async remove(ids: string[]): Promise<void> {
    await this.#optimistic(
      (list) => list.filter((c) => !ids.includes(c.id)),
      this.#http.post(`${API}/calls/bulk-delete`, { ids }),
    );
  }

  async clear(): Promise<void> {
    await this.#optimistic(() => [], this.#http.delete(`${API}/calls`));
  }

  /** Updates the list at once, then reloads it from the server if the request fails. */
  async #optimistic(
    change: (list: CallRecord[]) => CallRecord[],
    request: Parameters<typeof firstValueFrom>[0],
  ): Promise<void> {
    this.#calls.update(change);
    try {
      await firstValueFrom(request);
    } catch (error) {
      await this.load().catch(() => undefined);
      throw error;
    }
  }
}
