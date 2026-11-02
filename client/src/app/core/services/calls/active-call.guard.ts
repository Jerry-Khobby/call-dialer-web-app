import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CallService } from './call.service';

/** The call screen only makes sense while a call is in progress (e.g. not after a page reload). */
export const activeCallGuard: CanActivateFn = () =>
  inject(CallService).call() ? true : inject(Router).createUrlTree(['/keypad']);
