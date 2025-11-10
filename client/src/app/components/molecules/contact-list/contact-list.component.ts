import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ul class="space-y-2">
      <li
        *ngFor="let contact of contacts"
        (click)="selectContact(contact)"
        class="cursor-pointer px-3 py-2 rounded-lg hover:bg-white/10 transition"
      >
        {{ contact.name }}
      </li>
    </ul>
  `,
})
export class ContactListComponent {
  @Input() contacts: any[] = [];
  @Output() onSelect = new EventEmitter<any>();

  selectContact(contact: any) {
    this.onSelect.emit(contact);
  }
}
