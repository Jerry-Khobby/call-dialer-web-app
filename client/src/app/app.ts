import { Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { NotificationComponent } from './components/atoms/notification.component';
import { CallService } from './core/services/calls/call.service';
import { AuthService } from './core/services/auth/auth.service';
import { ContactService } from './core/services/contacts/contact.service';
import { RecentsService } from './core/services/calls/recents.service';
import { NotificationService } from './core/services/notification/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,RouterLink,MatIconModule,NotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  #router = inject(Router);
  calls = inject(CallService);

  #url = toSignal(
    this.#router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.#router.url },
  );

  /** Green "return to call" pill while a call runs and the user is on another screen. */
  showCallBanner = computed(() => !!this.calls.call() && !this.#url().startsWith('/call'));

  constructor() {
    const auth = inject(AuthService);
    const contacts = inject(ContactService);
    const recents = inject(RecentsService);
    const notifications = inject(NotificationService);

    // Check the saved session is still valid; a rejected token is logged out by the interceptor.
    auth.refresh().catch(() => undefined);

    // Load the account's data on login, and forget it on logout so the next account
    // never sees it.
    effect(() => {
      const loggedIn = auth.isLoggedIn();
      untracked(() => {
        if (!loggedIn) {
          this.calls.disconnect();
          contacts.reset();
          recents.reset();
          return;
        }
        // The calls socket lets other users ring this browser while the app is open.
        const token = auth.token();
        if (token) this.calls.connect(token);
        // If the token was rejected, the interceptor already logged out and said why.
        const failed = (what: string) => () => {
          if (auth.isLoggedIn()) notifications.showNotification(`Couldn't load your ${what}.`, 'error');
        };
        contacts.load().catch(failed('contacts'));
        recents.load().catch(failed('call history'));
      });
    });
  }
}
