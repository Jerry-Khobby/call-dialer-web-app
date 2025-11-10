import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactItemComponent } from '../../atoms/contact-item/contact-item.component';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [CommonModule, ContactItemComponent],
  templateUrl: './contact-list.component.html',
})
export class ContactListComponent {
  @Input() contacts: { name: string; phone: string }[] = [];
}
