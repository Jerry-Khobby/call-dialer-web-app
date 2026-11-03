import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** App pages need an account; send visitors to login and bring them back afterwards. */
export const authGuard: CanActivateFn = (_route, state) =>
  inject(AuthService).isLoggedIn()
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

/** Login and sign-up are only for visitors; a signed-in user goes to the keypad. */
export const guestGuard: CanActivateFn = () =>
  inject(AuthService).isLoggedIn() ? inject(Router).createUrlTree(['/keypad']) : true;
