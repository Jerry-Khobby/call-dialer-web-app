import { Routes } from '@angular/router';

import { KeypadPage } from './components/pages/keypad/keypad.page';

export const routes: Routes = [
  { path: '', redirectTo: 'keypad', pathMatch: 'full' },
  { path: 'keypad', component: KeypadPage },
  { path: 'contacts', component:KeypadPage },
  { path: 'recents', component: KeypadPage },
];
