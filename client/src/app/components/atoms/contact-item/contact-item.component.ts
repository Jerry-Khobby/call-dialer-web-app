import { Component, Input } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { Contact, fullName, initials } from '../../../core/services/contacts/contact.model';
import { formatPhone } from '../../../core/utils/phone';

@Component({
  selector: 'app-contact-item',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './contact-item.component.html',
})
export class ContactItemComponent {
  @Input() contact!: Contact;
  @Input() showPhone = true;

  fullName = fullName;
  initials = initials;
  formatPhone = formatPhone;
}
