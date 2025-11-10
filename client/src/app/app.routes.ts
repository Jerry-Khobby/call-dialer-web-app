import { Routes } from '@angular/router';

import { KeypadPage } from './components/pages/keypad/keypad.page';
import { NewContactComponent } from './components/pages/new-contact/new-contact.component';
import { ContactsPage } from './components/pages/contacts/contacts';
export const routes: Routes = [
  { path: '', redirectTo: 'keypad', pathMatch: 'full' },
  { path: 'keypad', component: KeypadPage },
  { path: 'contacts', component:ContactsPage },
  { path: 'recents', component: KeypadPage },
  {path:'new-contact',component:NewContactComponent},
];
