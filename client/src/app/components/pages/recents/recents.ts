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
import { formatCallTime, isSameDay } from '../../../core/utils/time';

type RecentGroup = {
  ids: string[];
  phoneNumber: string;
  callType: CallType;
  calledAt: Date; // newest call in the group
  contact?: Contact;
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
        });
      }
    }
    return groups;
  });

  hasCalls = computed(() => this.#recents.calls().length > 0);

  displayName(group: RecentGroup) {
    return group.contact ? fullName(group.contact) : formatPhone(group.phoneNumber);
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
      this.#router.navigate(['/contacts/new'], { queryParams: { phone: group.phoneNumber } });
    }
  }

  remove(group: RecentGroup) {
    this.#recents.remove(group.ids);
  }

  toggleEditing() {
    this.editing.update((e) => !e);
    this.confirmingClear.set(false);
  }

  clearAll() {
    this.#recents.clear();
    this.confirmingClear.set(false);
    this.editing.set(false);
  }
}
