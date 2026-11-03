import { Routes } from '@angular/router';

import { KeypadPage } from './components/pages/keypad/keypad.page';
import { ContactFormComponent } from './components/pages/contact-form/contact-form.component';
import { ContactsPage } from './components/pages/contacts/contacts';
import { ContactDetailPage } from './components/pages/contact-detail/contact-detail';
import { FavoritesPage } from './components/pages/favorites/favorites';
import { RecentsPage } from './components/pages/recents/recents';
import { CallPage } from './components/pages/call/call.page';
import { LoginPage } from './components/pages/login/login.page';
import { RegisterPage } from './components/pages/register/register.page';
import { AccountPage } from './components/pages/account/account.page';
import { activeCallGuard } from './core/services/calls/active-call.guard';
import { authGuard, guestGuard } from './core/services/auth/auth.guards';

export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [guestGuard], title: 'Log In' },
  { path: 'register', component: RegisterPage, canActivate: [guestGuard], title: 'Create Account' },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'keypad', pathMatch: 'full' },
      { path: 'keypad', component: KeypadPage, title: 'Keypad' },
      { path: 'favorites', component: FavoritesPage, title: 'Favorites' },
      { path: 'recents', component: RecentsPage, title: 'Recents' },
      { path: 'contacts', component: ContactsPage, title: 'Contacts' },
      { path: 'contacts/new', component: ContactFormComponent, title: 'New Contact' },
      { path: 'contacts/:id', component: ContactDetailPage, title: 'Contact' },
      { path: 'contacts/:id/edit', component: ContactFormComponent, title: 'Edit Contact' },
      { path: 'account', component: AccountPage, title: 'My Card' },
      { path: 'call', component: CallPage, canActivate: [activeCallGuard], title: 'Call' },
    ],
  },
  { path: '**', redirectTo: 'keypad' },
];
