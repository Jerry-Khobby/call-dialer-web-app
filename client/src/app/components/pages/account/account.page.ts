import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { TabBar } from '../../organisms/tab-bar/tab-bar';
import { AuthService } from '../../../core/services/auth/auth.service';
import { nameInitials } from '../../../core/services/auth/auth.model';
import { formatPhone } from '../../../core/utils/phone';
import { ThemeChoice, ThemeService } from '../../../core/services/theme/theme.service';

/** "My Card": the signed-in account, light/dark appearance, and log out. */
@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [MatIconModule, RouterLink, AvatarComponent, TabBar],
  templateUrl: './account.page.html',
})
export class AccountPage {
  #auth = inject(AuthService);
  user = this.#auth.user;
  formatPhone = formatPhone;

  initials = computed(() => nameInitials(this.user()?.fullName ?? ''));

  theme = inject(ThemeService);
  themeOptions: { value: ThemeChoice; label: string; icon: string }[] = [
    { value: 'system', label: 'System', icon: 'brightness_auto' },
    { value: 'light', label: 'Light', icon: 'light_mode' },
    { value: 'dark', label: 'Dark', icon: 'dark_mode' },
  ];

  logout() {
    this.#auth.logout();
  }
}
