import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API } from '../../api/api';
import { loadJson, saveJson } from '../../utils/storage';
import { AuthResponse, RegisterInput, User } from './auth.model';

const TOKEN_KEY = 'dialer.token';
const USER_KEY = 'dialer.user';

/** The signed-in account. The token is kept in localStorage so a reload stays logged in. */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  #http = inject(HttpClient);
  #router = inject(Router);

  #token = signal<string | null>(loadJson<string | null>(TOKEN_KEY, null));
  #user = signal<User | null>(loadJson<User | null>(USER_KEY, null));

  token = this.#token.asReadonly();
  user = this.#user.asReadonly();
  isLoggedIn = computed(() => !!this.#token());

  constructor() {
    effect(() => {
      saveJson(TOKEN_KEY, this.#token());
      saveJson(USER_KEY, this.#user());
    });
  }

  async login(email: string, password: string): Promise<void> {
    this.#start(
      await firstValueFrom(this.#http.post<AuthResponse>(`${API}/auth/login`, { email, password })),
    );
  }

  async register(input: RegisterInput): Promise<void> {
    this.#start(await firstValueFrom(this.#http.post<AuthResponse>(`${API}/auth/register`, input)));
  }

  /** Re-reads the profile on startup; a token the server rejects is logged out by the interceptor. */
  async refresh(): Promise<void> {
    if (!this.#token()) return;
    this.#user.set(await firstValueFrom(this.#http.get<User>(`${API}/auth/me`)));
  }

  logout(): void {
    this.#token.set(null);
    this.#user.set(null);
    this.#router.navigate(['/login']);
  }

  #start({ accessToken, user }: AuthResponse): void {
    this.#token.set(accessToken);
    this.#user.set(user);
  }
}
