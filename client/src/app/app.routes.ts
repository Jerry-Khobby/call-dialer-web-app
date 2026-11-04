import { Routes } from '@angular/router';

import { activeCallGuard } from './core/services/calls/active-call.guard';
import { authGuard, guestGuard } from './core/services/auth/auth.guards';

// Each screen is loaded the first time it's opened, which keeps the first download small
// on a phone. The call service itself stays in the main bundle: calls can ring on any page.
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/pages/login/login.page').then((m) => m.LoginPage),
    canActivate: [guestGuard],
    title: 'Log In',
  },
  {
    path: 'register',
    loadComponent: () => import('./components/pages/register/register.page').then((m) => m.RegisterPage),
    canActivate: [guestGuard],
    title: 'Create Account',
  },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'keypad', pathMatch: 'full' },
      {
        path: 'keypad',
        loadComponent: () => import('./components/pages/keypad/keypad.page').then((m) => m.KeypadPage),
        title: 'Keypad',
      },
      {
        path: 'favorites',
        loadComponent: () => import('./components/pages/favorites/favorites').then((m) => m.FavoritesPage),
        title: 'Favorites',
      },
      {
        path: 'recents',
        loadComponent: () => import('./components/pages/recents/recents').then((m) => m.RecentsPage),
        title: 'Recents',
      },
      {
        path: 'contacts',
        loadComponent: () => import('./components/pages/contacts/contacts').then((m) => m.ContactsPage),
        title: 'Contacts',
      },
      {
        path: 'contacts/new',
        loadComponent: () =>
          import('./components/pages/contact-form/contact-form.component').then((m) => m.ContactFormComponent),
        title: 'New Contact',
      },
      {
        path: 'contacts/:id',
        loadComponent: () =>
          import('./components/pages/contact-detail/contact-detail').then((m) => m.ContactDetailPage),
        title: 'Contact',
      },
      {
        path: 'contacts/:id/edit',
        loadComponent: () =>
          import('./components/pages/contact-form/contact-form.component').then((m) => m.ContactFormComponent),
        title: 'Edit Contact',
      },
      {
        path: 'account',
        loadComponent: () => import('./components/pages/account/account.page').then((m) => m.AccountPage),
        title: 'My Card',
      },
      {
        path: 'call',
        loadComponent: () => import('./components/pages/call/call.page').then((m) => m.CallPage),
        canActivate: [activeCallGuard],
        title: 'Call',
      },
    ],
  },
  { path: '**', redirectTo: 'keypad' },
];
