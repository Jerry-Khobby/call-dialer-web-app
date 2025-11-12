import { Routes } from '@angular/router';

import { KeypadPage } from './components/pages/keypad/keypad.page';
import { NewContactComponent } from './components/pages/new-contact/new-contact.component';
import { ContactsPage } from './components/pages/contacts/contacts';
import { CallerScreenComponent } from './components/organisms/caller-screen/caller-screen.component';

import { RecentsComponent } from './components/pages/recents/recents';
export const routes: Routes = [
  { path: '', redirectTo: 'keypad', pathMatch: 'full' },
  { path: 'keypad', component: KeypadPage },
  { path: 'contacts', component:ContactsPage },
    { path: 'call/:name', component: CallerScreenComponent },
  { path: 'recents', component: RecentsComponent },
  {path:'new-contact',component:NewContactComponent},
  { path: '**', redirectTo: 'contacts' },
];
