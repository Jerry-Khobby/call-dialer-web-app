import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth/auth.service';
import { apiErrorMessage } from '../../../core/api/api';
import { PasswordInputComponent } from '../../atoms/password-input/password-input.component';

/** Where to go after signing in: only paths inside the app, never another site. */
export function safeReturnUrl(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/keypad';
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule, PasswordInputComponent],
  templateUrl: './login.page.html',
})
export class LoginPage {
  #auth = inject(AuthService);
  #router = inject(Router);
  returnUrl = safeReturnUrl(inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl'));

  email = signal('');
  password = signal('');
  error = signal('');
  busy = signal(false);

  async submit() {
    if (this.busy()) return;
    this.error.set('');
    if (!this.email().trim() || !this.password()) {
      this.error.set('Enter your email and password.');
      return;
    }

    this.busy.set(true);
    try {
      await this.#auth.login(this.email().trim(), this.password());
      this.#router.navigateByUrl(this.returnUrl);
    } catch (error) {
      this.error.set(apiErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
