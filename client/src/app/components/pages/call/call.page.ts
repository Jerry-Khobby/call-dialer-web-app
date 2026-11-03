import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CallControlsComponent } from '../../molecules/call-controls/call-controls.component';
import { KeypadComponent } from '../../organisms/keypad/keypad.component';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { CallService } from '../../../core/services/calls/call.service';
import { ContactService } from '../../../core/services/contacts/contact.service';
import { fullName, initials } from '../../../core/services/contacts/contact.model';
import { nameInitials } from '../../../core/services/auth/auth.model';
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

  /** A saved contact's name, else the caller's Dialer name, else the number. */
  title = computed(() => {
    const contact = this.contact();
    if (contact) return fullName(contact);
    const call = this.call();
    return call?.callerName ?? formatPhone(call?.phoneNumber ?? '');
  });

  /** The number under the name, whenever a name is shown. */
  showNumber = computed(() => !!this.contact() || !!this.call()?.callerName);

  avatarInitials = computed(() => {
    const contact = this.contact();
    if (contact) return initials(contact);
    return nameInitials(this.call()?.callerName ?? '');
  });

  status = computed(() => {
    const call = this.call();
    switch (call?.status) {
      case 'dialing':
        return 'calling…';
      case 'ringing':
        return 'ringing…';
      case 'incoming':
        return 'Dialer audio call';
      case 'connecting':
        return 'connecting…';
      case 'connected':
        return formatDuration(this.calls.elapsed());
      default:
        return call?.message ?? 'Call ended';
    }
  });

  /** Mute and keypad only make sense once the call has been answered. */
  controlsDisabled = computed(() => {
    const status = this.call()?.status;
    return status !== 'connecting' && status !== 'connected';
  });

  formatPhone = formatPhone;
}
