import { Injectable, computed, effect, signal } from '@angular/core';
import { loadJson, saveJson } from '../../utils/storage';

export type ThemeChoice = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'dialer.theme';

/**
 * Light or dark: follows the device setting until the user picks one on My Card.
 * The theme is applied as `data-theme` on <html>; index.html sets it before Angular
 * starts, so a reload never flashes the wrong theme.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  #media = window.matchMedia('(prefers-color-scheme: light)');
  #systemLight = signal(this.#media.matches);

  choice = signal<ThemeChoice>(loadJson<ThemeChoice>(STORAGE_KEY, 'system'));

  /** The theme actually shown. */
  theme = computed(() => {
    const choice = this.choice();
    if (choice !== 'system') return choice;
    return this.#systemLight() ? 'light' : 'dark';
  });

  constructor() {
    this.#media.addEventListener('change', (event) => this.#systemLight.set(event.matches));
    effect(() => {
      document.documentElement.dataset['theme'] = this.theme();
      saveJson(STORAGE_KEY, this.choice());
    });
  }
}
