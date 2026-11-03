import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TabBar } from '../../organisms/tab-bar/tab-bar';
import { RecentsService } from '../../../core/services/calls/recents.service';
import { CallService } from '../../../core/services/calls/call.service';
import { CallType } from '../../../core/services/calls/call.model';
import { ContactService } from '../../../core/services/contacts/contact.service';
import { Contact, fullName } from '../../../core/services/contacts/contact.model';
import { formatPhone, samePhone } from '../../../core/utils/phone';
import { NotificationService } from '../../../core/services/notification/notification.service';
import { apiErrorMessage } from '../../../core/api/api';
import { formatCallTime, isSameDay } from '../../../core/utils/time';

type RecentGroup = {
  ids: string[];
  phoneNumber: string;
  callType: CallType;
  calledAt: Date; // newest call in the group
  contact?: Contact;
  contactName?: string; // Caller ID for numbers that aren't in contacts
};

@Component({
  selector: 'app-recents-page',
  standalone: true,
  imports: [NgClass, MatIconModule, TabBar],
  templateUrl: './recents.html',
})
export class RecentsPage {
  #router = inject(Router);
  #recents = inject(RecentsService);
  #calls = inject(CallService);
  #contacts = inject(ContactService);
  #notifications = inject(NotificationService);

  filter = signal<'all' | 'missed'>('all');
  editing = signal(false);
  confirmingClear = signal(false);

  callIcons: Record<CallType, string> = {
    outgoing: 'call_made',
    incoming: 'call_received',
    missed: 'call_missed',
  };

  /**
   * Like a phone, only back-to-back calls with the same number, type and day are
   * collapsed into one row ("Daniel White (3)").
   */
  groups = computed(() => {
    const calls = this.#recents
      .calls()
      .filter((c) => this.filter() === 'all' || c.callType === 'missed');

    const groups: RecentGroup[] = [];
    for (const call of calls) {
      const calledAt = new Date(call.calledAt);
      const previous = groups.at(-1);
      if (
        previous &&
        previous.callType === call.callType &&
        samePhone(previous.phoneNumber, call.phoneNumber) &&
        isSameDay(previous.calledAt, calledAt)
      ) {
        previous.ids.push(call.id);
      } else {
        groups.push({
          ids: [call.id],
          phoneNumber: call.phoneNumber,
          callType: call.callType,
          calledAt,
          contact: this.#contacts.findByPhone(call.phoneNumber),
          contactName: call.contactName,
        });
      }
    }
    return groups;
  });

  hasCalls = computed(() => this.#recents.calls().length > 0);
  loaded = this.#recents.loaded;

  /** A saved contact's name, else the caller's Dialer name, else the number. */
  displayName(group: RecentGroup) {
    if (group.contact) return fullName(group.contact);
    return group.contactName ?? formatPhone(group.phoneNumber);
  }

  /** Under the name: "mobile" for contacts, the number for other Dialer users, else "unknown". */
  subtitle(group: RecentGroup) {
    if (group.contact) return 'mobile';
    return group.contactName ? formatPhone(group.phoneNumber) : 'unknown';
  }

  callTime(group: RecentGroup) {
    return formatCallTime(group.calledAt);
  }

  callBack(group: RecentGroup) {
    if (!this.editing()) this.#calls.dial(group.phoneNumber);
  }

  showInfo(group: RecentGroup) {
    if (group.contact) {
      this.#router.navigate(['/contacts', group.contact.id]);
    } else {
      // A Dialer caller who isn't a contact yet: start the new contact with their name too.
      this.#router.navigate(['/contacts/new'], {
        queryParams: { phone: group.phoneNumber, name: group.contactName },
      });
    }
  }

  remove(group: RecentGroup) {
    this.#recents.remove(group.ids).catch((error: unknown) => this.#showError(error));
  }

  toggleEditing() {
    this.editing.update((e) => !e);
    this.confirmingClear.set(false);
  }

  clearAll() {
    this.#recents.clear().catch((error: unknown) => this.#showError(error));
    this.confirmingClear.set(false);
    this.editing.set(false);
  }

  #showError(error: unknown) {
    this.#notifications.showNotification(apiErrorMessage(error), 'error');
  }
}
