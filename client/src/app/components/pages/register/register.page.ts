import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth/auth.service';
import { apiErrorMessage } from '../../../core/api/api';
import { isValidPhone } from '../../../core/utils/phone';
import { safeReturnUrl } from '../login/login.page';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule],
  templateUrl: './register.page.html',
})
export class RegisterPage {
  #auth = inject(AuthService);
  #router = inject(Router);
  returnUrl = safeReturnUrl(inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl'));

  fullName = signal('');
  phoneNumber = signal('');
  email = signal('');
  password = signal('');
  submitted = signal(false);
  error = signal('');
  busy = signal(false);

  // Same rules as the server, so most mistakes are caught before a round trip.
  errors = computed(() => ({
    fullName: this.fullName().trim() ? '' : 'Enter your name.',
    phoneNumber: isValidPhone(this.phoneNumber())
      ? ''
      : 'Enter 3–15 digits (spaces, dashes and a leading + are fine).',
    email: /^\S+@\S+\.\S+$/.test(this.email().trim()) ? '' : 'Enter a valid email address.',
    password:
      this.password().length >= 8 && this.password().length <= 72
        ? ''
        : 'Use 8 to 72 characters.',
  }));

  valid = computed(() => Object.values(this.errors()).every((e) => !e));

  async submit() {
    if (this.busy()) return;
    this.submitted.set(true);
    this.error.set('');
    if (!this.valid()) return;

    this.busy.set(true);
    try {
      await this.#auth.register({
        fullName: this.fullName().trim(),
        phoneNumber: this.phoneNumber().trim(),
        email: this.email().trim(),
        password: this.password(),
      });
      this.#router.navigateByUrl(this.returnUrl);
    } catch (error) {
      this.error.set(apiErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
