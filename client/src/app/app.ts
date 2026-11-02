import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { NotificationComponent } from './components/atoms/notification.component';
import { CallService } from './core/services/calls/call.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,RouterLink,NotificationComponent],
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
}
