import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { KeypadComponent } from '../../organisms/keypad/keypad.component';
import { TabBar } from '../../organisms/tab-bar/tab-bar';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { LongPressDirective } from '../../atoms/long-press.directive';
import { ContactService } from '../../../core/services/contacts/contact.service';
import { fullName } from '../../../core/services/contacts/contact.model';
import { RecentsService } from '../../../core/services/calls/recents.service';
import { CallService } from '../../../core/services/calls/call.service';
import { NotificationService } from '../../../core/services/notification/notification.service';
import { formatPhone, isDialable, normalizePhone, sanitizePhone } from '../../../core/utils/phone';

const MAX_LENGTH = 20;

@Component({
  selector: 'app-keypad-page',
  standalone: true,
  imports: [MatIconModule, RouterLink, KeypadComponent, TabBar, LongPressDirective],
  templateUrl: './keypad.page.html',
  styleUrl:'./keypad.page.css'
})
export class KeypadPage {
  #router = inject(Router);
  #contacts = inject(ContactService);
  #recents = inject(RecentsService);
  #calls = inject(CallService);
  #notifications = inject(NotificationService);

  typedNumber = signal('');
  isPopping = false;
  showAddOptions = signal(false);

  formattedNumber = computed(() => formatPhone(this.typedNumber()));

  /** Saved contact for the typed number, shown under it like a phone does. */
  matchedContact = computed(() =>
    normalizePhone(this.typedNumber()).length >= 3
      ? this.#contacts.findByPhone(this.typedNumber())
      : undefined,
  );

  fullName = fullName;

  addDigit(key: string) {
    const current = this.typedNumber();
    if (current.length >= MAX_LENGTH) return;

    // "+" is only valid as the first character; anywhere else holding 0 just types 0.
    const next = key === '+' && current ? '0' : key;
    this.typedNumber.set(sanitizePhone(current + next));

    this.isPopping = true;
    setTimeout(() => (this.isPopping = false), 180);
  }

  clearLastDigit() {
    this.typedNumber.update((n) => n.slice(0, -1));
  }

  clearAll() {
    this.typedNumber.set('');
    this.showAddOptions.set(false);
  }

  createNewContact() {
    this.#router.navigate(['/contacts/new'], { queryParams: { phone: this.typedNumber() } });
  }

  addToExistingContact() {
    this.#router.navigate(['/contacts'], { queryParams: { addNumber: this.typedNumber() } });
  }

  async callThisNumber() {
    const number = this.typedNumber();

    // Pressing call with nothing typed brings back the last dialed number. Right after the
    // app opens the history may still be loading, so wait for it instead of doing nothing.
    if (!number) {
      await this.#recents.ready().catch(() => undefined);
      const last = this.#recents.lastDialed();
      if (last && !this.typedNumber()) this.typedNumber.set(last);
      return;
    }

    if (!isDialable(number)) {
      this.#notifications.showNotification('Enter a valid phone number.', 'warning');
      return;
    }

    this.typedNumber.set('');
    this.#calls.dial(number);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select')) return;

    if (/^[0-9*#+]$/.test(event.key)) {
      event.preventDefault();
      this.addDigit(event.key);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      this.clearLastDigit();
    } else if (event.key === 'Escape') {
      if (this.showAddOptions()) this.showAddOptions.set(false);
      else this.clearAll();
    } else if (
      event.key === 'Enter' &&
      (!target.closest('button, a') || target.closest('[data-keypad-key]'))
    ) {
      // Enter calls, even when a digit key kept focus after a click (otherwise it would
      // "click" that digit again). Other focused buttons and links keep their own Enter.
      event.preventDefault();
      this.callThisNumber();
    }
  }

  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    if ((event.target as HTMLElement).closest('input, textarea')) return;
    const pasted = sanitizePhone(event.clipboardData?.getData('text') ?? '');
    if (pasted) {
      this.typedNumber.update((n) => sanitizePhone(n + pasted).slice(0, MAX_LENGTH));
    }
  }
}
