import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { NotificationService } from '../services/notification/notification.service';
import { API } from './api';

/** Sends the login token with API requests, and logs out when the server rejects it. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const notifications = inject(NotificationService);
  const token = auth.token();
  const isApi = req.url.startsWith(API);

  const request =
    token && isApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      // A 401 with a token means the session expired (or the account is gone).
      if (error instanceof HttpErrorResponse && error.status === 401 && token && isApi) {
        notifications.showNotification('Your session has expired. Please log in again.', 'info');
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
