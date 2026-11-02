import { Injectable, computed, effect, signal } from '@angular/core';
import { Contact, ContactInput, fullName } from './contact.model';
import { samePhone } from '../../utils/phone';
import { loadJson, saveJson } from '../../utils/storage';

const STORAGE_KEY = 'dialer.contacts';

// Demo data shown on first run, until the contacts API is wired up.
const SEED_CONTACTS: Contact[] = [
  { id: 'seed-alice', firstName: 'Alice', lastName: 'Johnson', phoneNumber: '0241234567', favorite: true },
  { id: 'seed-ben', firstName: 'Ben', lastName: 'Adams', phoneNumber: '0205559870', favorite: false },
  { id: 'seed-chris', firstName: 'Chris', lastName: 'Smith', phoneNumber: '0277778888', favorite: false },
  { id: 'seed-daniel', firstName: 'Daniel', lastName: 'White', phoneNumber: '0559993333', favorite: true },
];

function clean(input: ContactInput): ContactInput {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phoneNumber: input.phoneNumber.trim(),
  };
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  #contacts = signal<Contact[]>(loadJson(STORAGE_KEY, SEED_CONTACTS));

  /** All contacts in alphabetical order, the way a phone's contact list shows them. */
  contacts = computed(() =>
    [...this.#contacts()].sort((a, b) =>
      fullName(a).localeCompare(fullName(b), undefined, { sensitivity: 'base' }),
    ),
  );

  favorites = computed(() => this.contacts().filter((c) => c.favorite));

  constructor() {
    effect(() => saveJson(STORAGE_KEY, this.#contacts()));
  }

  getById(id: string): Contact | undefined {
    return this.#contacts().find((c) => c.id === id);
  }

  findByPhone(phoneNumber: string): Contact | undefined {
    return this.#contacts().find((c) => samePhone(c.phoneNumber, phoneNumber));
  }

  add(input: ContactInput): Contact {
    const contact: Contact = { ...clean(input), id: crypto.randomUUID(), favorite: false };
    this.#contacts.update((list) => [...list, contact]);
    return contact;
  }

  update(id: string, input: ContactInput): void {
    this.#contacts.update((list) => list.map((c) => (c.id === id ? { ...c, ...clean(input) } : c)));
  }

  remove(id: string): void {
    this.#contacts.update((list) => list.filter((c) => c.id !== id));
  }

  toggleFavorite(id: string): void {
    this.#contacts.update((list) =>
      list.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)),
    );
  }
}
