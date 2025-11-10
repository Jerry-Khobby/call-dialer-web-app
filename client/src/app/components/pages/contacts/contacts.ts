import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchInputComponent } from '../../atoms/search-input/search-input.component';
import { ContactListComponent } from '../../molecules/contact-list/contact-list.component';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TabBar } from '../../organisms/tab-bar/tab-bar';

@Component({
  selector: 'app-contacts-page',
  standalone: true,
  styleUrl:'./contacts.css',
  imports: [CommonModule, MatIconModule, SearchInputComponent, ContactListComponent,TabBar],
  templateUrl: './contacts.html',
})
export class ContactsPage {
  constructor(private router: Router) {}

  contacts = [
    { name: 'Alice Johnson', phone: '123-456' },
    { name: 'Ben Adams', phone: '555-987' },
    { name: 'Chris Smith', phone: '777-888' },
    { name: 'Daniel White', phone: '999-333' },
    
  ];

  filteredContacts = [...this.contacts];

  filterContacts(query: string) {
    const lower = query.toLowerCase();
    this.filteredContacts = this.contacts
      .filter(c => c.name.toLowerCase().includes(lower))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  addContact() {
    this.router.navigate(['/keypad']);
  }
}
