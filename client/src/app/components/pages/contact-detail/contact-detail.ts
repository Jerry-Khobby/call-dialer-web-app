import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { TabBar } from '../../organisms/tab-bar/tab-bar';
import { ContactService } from '../../../core/services/contacts/contact.service';
import { fullName, initials } from '../../../core/services/contacts/contact.model';
import { RecentsService } from '../../../core/services/calls/recents.service';
import { CallService } from '../../../core/services/calls/call.service';
import { CallType } from '../../../core/services/calls/call.model';
import { formatPhone, samePhone } from '../../../core/utils/phone';
import { formatCallTime, formatDuration } from '../../../core/utils/time';
import { NotificationService } from '../../../core/services/notification/notification.service';
import { apiErrorMessage } from '../../../core/api/api';

@Component({
  selector: 'app-contact-detail-page',
  standalone: true,
  imports: [MatIconModule, RouterLink, AvatarComponent, TabBar],
  templateUrl: './contact-detail.html',
})
export class ContactDetailPage {
  #contactService = inject(ContactService);
  #recents = inject(RecentsService);
  #calls = inject(CallService);
  #notifications = inject(NotificationService);
  #id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  contact = computed(() => this.#contactService.getById(this.#id));

  recentCalls = computed(() => {
    const contact = this.contact();
    if (!contact) return [];
    return this.#recents
      .calls()
      .filter((c) => samePhone(c.phoneNumber, contact.phoneNumber))
      .slice(0, 5);
  });

  callLabels: Record<CallType, string> = {
    outgoing: 'Outgoing Call',
    incoming: 'Incoming Call',
    missed: 'Missed Call',
  };

  fullName = fullName;
  initials = initials;
  formatPhone = formatPhone;
  formatDuration = formatDuration;

  callTime(iso: string) {
    return formatCallTime(new Date(iso));
  }

  call() {
    const contact = this.contact();
    if (contact) this.#calls.dial(contact.phoneNumber);
  }

  /** The list may still be loading when the page is opened directly. */
  loaded = this.#contactService.loaded;

  toggleFavorite() {
    this.#contactService
      .toggleFavorite(this.#id)
      .catch((error: unknown) =>
        this.#notifications.showNotification(apiErrorMessage(error), 'error'),
      );
  }
}
