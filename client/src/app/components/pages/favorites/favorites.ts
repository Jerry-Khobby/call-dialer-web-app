import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ContactItemComponent } from '../../atoms/contact-item/contact-item.component';
import { TabBar } from '../../organisms/tab-bar/tab-bar';
import { ContactService } from '../../../core/services/contacts/contact.service';
import { Contact, fullName } from '../../../core/services/contacts/contact.model';
import { CallService } from '../../../core/services/calls/call.service';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [MatIconModule, RouterLink, ContactItemComponent, TabBar],
  templateUrl: './favorites.html',
})
export class FavoritesPage {
  #calls = inject(CallService);
  favorites = inject(ContactService).favorites;
  fullName = fullName;

  call(contact: Contact) {
    this.#calls.dial(contact.phoneNumber);
  }
}
