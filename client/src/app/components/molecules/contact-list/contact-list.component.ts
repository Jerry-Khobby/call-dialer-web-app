import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ContactItemComponent } from '../../atoms/contact-item/contact-item.component';
import { Contact } from '../../../core/services/contacts/contact.model';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [ContactItemComponent],
  templateUrl: './contact-list.component.html',
})
export class ContactListComponent {
  @Input() contacts: Contact[] = [];
  @Input() showPhone = true;
  @Output() contactSelected = new EventEmitter<Contact>();
}
