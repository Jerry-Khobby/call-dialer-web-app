import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Component, computed, inject, signal } from '@angular/core';
import { SearchInputComponent } from '../../atoms/search-input/search-input.component';
import { ContactListComponent } from '../../molecules/contact-list/contact-list.component';
import { MatIconModule } from '@angular/material/icon';
import { TabBar } from '../../organisms/tab-bar/tab-bar';
import { ContactService } from '../../../core/services/contacts/contact.service';
import { Contact, fullName } from '../../../core/services/contacts/contact.model';
import { formatPhone, normalizePhone } from '../../../core/utils/phone';

const INDEX_LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#'];

function sectionLetter(contact: Contact): string {
  const first = fullName(contact)
    .charAt(0)
    .normalize('NFD')
    .charAt(0)
    .toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
}

@Component({
  selector: 'app-contacts-page',
  standalone: true,
  imports: [MatIconModule, RouterLink, SearchInputComponent, ContactListComponent, TabBar],
  templateUrl: './contacts.html',
})
export class ContactsPage {
  #router = inject(Router);
  #contactService = inject(ContactService);

  /** Set when the keypad's "Add to Existing Contact" sends the user here to pick a contact. */
  addNumber = inject(ActivatedRoute).snapshot.queryParamMap.get('addNumber');

  query = signal('');
  indexLetters = INDEX_LETTERS;
  formatPhone = formatPhone;

  totalContacts = computed(() => this.#contactService.contacts().length);

  filteredContacts = computed(() => {
    const query = this.query().trim().toLowerCase();
    const digits = normalizePhone(query);
    if (!query) return this.#contactService.contacts();

    return this.#contactService
      .contacts()
      .filter(
        (c) =>
          fullName(c).toLowerCase().includes(query) ||
          (digits.length > 0 && normalizePhone(c.phoneNumber).includes(digits)),
      );
  });

  /** Contacts grouped under A–Z headers, with names that don't start with a letter under "#". */
  sections = computed(() => {
    const groups = new Map<string, Contact[]>();
    for (const contact of this.filteredContacts()) {
      const letter = sectionLetter(contact);
      groups.set(letter, [...(groups.get(letter) ?? []), contact]);
    }
    return INDEX_LETTERS.filter((l) => groups.has(l)).map((letter) => ({
      letter,
      contacts: groups.get(letter)!,
    }));
  });

  openContact(contact: Contact) {
    if (this.addNumber) {
      this.#router.navigate(['/contacts', contact.id, 'edit'], {
        queryParams: { phone: this.addNumber },
      });
    } else {
      this.#router.navigate(['/contacts', contact.id]);
    }
  }

  /** Alphabet index: jump to the letter's section, or the next one that exists. */
  jumpTo(letter: string) {
    const position = INDEX_LETTERS.indexOf(letter);
    const target = this.sections().find((s) => INDEX_LETTERS.indexOf(s.letter) >= position);
    if (!target) return;
    document
      .getElementById(`section-${target.letter}`)
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
}
