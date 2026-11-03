import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API } from '../../api/api';
import { Contact, ContactInput, fullName } from './contact.model';
import { samePhone } from '../../utils/phone';

/** The signed-in user's contacts, kept in a signal and saved through the API. */
@Injectable({
  providedIn: 'root',
})
export class ContactService {
  #http = inject(HttpClient);
  #contacts = signal<Contact[]>([]);
  #loaded = signal(false);
  #loading?: Promise<void>;

  /** All contacts in alphabetical order, the way a phone's contact list shows them. */
  contacts = computed(() =>
    [...this.#contacts()].sort((a, b) =>
      fullName(a).localeCompare(fullName(b), undefined, { sensitivity: 'base' }),
    ),
  );

  favorites = computed(() => this.contacts().filter((c) => c.favorite));

  /** False until the first load finishes, so pages don't flash "No Contacts". */
  loaded = this.#loaded.asReadonly();

  /** Fetches the list from the server; called when someone logs in. */
  load(): Promise<void> {
    this.#loading = firstValueFrom(this.#http.get<Contact[]>(`${API}/contacts`)).then((list) => {
      this.#contacts.set(list);
      this.#loaded.set(true);
    });
    return this.#loading;
  }

  /** Resolves once the list is loaded (loading it if nothing has yet). */
  ready(): Promise<void> {
    return this.#loading ?? this.load();
  }

  /** Forgets everything, so the next account to log in never sees these contacts. */
  reset(): void {
    this.#contacts.set([]);
    this.#loaded.set(false);
    this.#loading = undefined;
  }

  getById(id: string): Contact | undefined {
    return this.#contacts().find((c) => c.id === id);
  }

  findByPhone(phoneNumber: string): Contact | undefined {
    return this.#contacts().find((c) => samePhone(c.phoneNumber, phoneNumber));
  }

  async add(input: ContactInput): Promise<Contact> {
    const contact = await firstValueFrom(this.#http.post<Contact>(`${API}/contacts`, input));
    this.#contacts.update((list) => [...list, contact]);
    return contact;
  }

  async update(id: string, input: ContactInput): Promise<void> {
    const contact = await firstValueFrom(
      this.#http.patch<Contact>(`${API}/contacts/${id}`, input),
    );
    this.#replace(contact);
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.#http.delete<void>(`${API}/contacts/${id}`));
    this.#contacts.update((list) => list.filter((c) => c.id !== id));
  }

  /** Stars or un-stars at once, and puts it back if the server refuses. */
  async toggleFavorite(id: string): Promise<void> {
    const contact = this.getById(id);
    if (!contact) return;

    const favorite = !contact.favorite;
    this.#replace({ ...contact, favorite });
    try {
      await firstValueFrom(this.#http.patch<Contact>(`${API}/contacts/${id}`, { favorite }));
    } catch (error) {
      this.#replace(contact);
      throw error;
    }
  }

  #replace(contact: Contact): void {
    this.#contacts.update((list) => list.map((c) => (c.id === contact.id ? contact : c)));
  }
}
