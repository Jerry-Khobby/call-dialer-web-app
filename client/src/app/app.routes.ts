import { Routes } from '@angular/router';

import { KeypadPage } from './components/pages/keypad/keypad.page';
import { ContactFormComponent } from './components/pages/contact-form/contact-form.component';
import { ContactsPage } from './components/pages/contacts/contacts';
import { ContactDetailPage } from './components/pages/contact-detail/contact-detail';
import { FavoritesPage } from './components/pages/favorites/favorites';
import { RecentsPage } from './components/pages/recents/recents';
import { CallerScreenComponent } from './components/organisms/caller-screen/caller-screen.component';

export const routes: Routes = [
  { path: '', redirectTo: 'keypad', pathMatch: 'full' },
  { path: 'keypad', component: KeypadPage, title: 'Keypad' },
  { path: 'favorites', component: FavoritesPage, title: 'Favorites' },
  { path: 'recents', component: RecentsPage, title: 'Recents' },
  { path: 'contacts', component: ContactsPage, title: 'Contacts' },
  { path: 'contacts/new', component: ContactFormComponent, title: 'New Contact' },
  { path: 'contacts/:id', component: ContactDetailPage, title: 'Contact' },
  { path: 'contacts/:id/edit', component: ContactFormComponent, title: 'Edit Contact' },
  { path: 'call/:name', component: CallerScreenComponent },
  { path: '**', redirectTo: 'keypad' },
];
