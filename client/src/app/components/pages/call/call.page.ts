import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CallControlsComponent } from '../../molecules/call-controls/call-controls.component';
import { KeypadComponent } from '../../organisms/keypad/keypad.component';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { CallService } from '../../../core/services/calls/call.service';
import { ContactService } from '../../../core/services/contacts/contact.service';
import { fullName, initials } from '../../../core/services/contacts/contact.model';
import { formatPhone } from '../../../core/utils/phone';
import { formatDuration } from '../../../core/utils/time';

@Component({
  selector: 'app-call-page',
  standalone: true,
  imports: [MatIconModule, CallControlsComponent, KeypadComponent, AvatarComponent],
  templateUrl: './call.page.html',
})
export class CallPage {
  calls = inject(CallService);
  #contacts = inject(ContactService);

  call = this.calls.call;
  showKeypad = signal(false);

  contact = computed(() => {
    const call = this.call();
    return call ? this.#contacts.findByPhone(call.phoneNumber) : undefined;
  });

  title = computed(() => {
    const contact = this.contact();
    return contact ? fullName(contact) : formatPhone(this.call()?.phoneNumber ?? '');
  });

  avatarInitials = computed(() => {
    const contact = this.contact();
    return contact ? initials(contact) : '';
  });

  status = computed(() => {
    switch (this.call()?.status) {
      case 'dialing':
        return 'calling…';
      case 'ringing':
        return 'ringing…';
      case 'connected':
        return formatDuration(this.calls.elapsed());
      default:
        return 'Call ended';
    }
  });

  formatPhone = formatPhone;
}
