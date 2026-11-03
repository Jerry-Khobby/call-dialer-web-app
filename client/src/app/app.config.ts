import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';

import { routes } from './app.routes';
import { authInterceptor } from './core/api/auth.interceptor';
import { ThemeService } from './core/services/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => {
      // Rounded icons match the redesign's soft shapes. `mat-ligature-font` tells mat-icon
      // that this font draws an icon from its name (e.g. "call"); without it nothing shows.
      inject(MatIconRegistry).setDefaultFontSetClass('material-icons-round', 'mat-ligature-font');
      inject(ThemeService); // applies light/dark and follows the device setting
    })
  ]
};
