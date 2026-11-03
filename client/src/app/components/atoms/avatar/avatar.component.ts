import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

const TONES = ['blue', 'green', 'amber', 'violet'] as const;

/**
 * Round avatar with the contact's initials, or a person icon for unknown numbers.
 * The colour comes from the initials, so a person keeps the same colour everywhere.
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div
      class="rounded-full font-display font-extrabold flex items-center justify-center select-none shrink-0"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.font-size.px]="size * 0.36"
      [style.background]="'var(--c-avatar-' + tone + '-bg)'"
      [style.color]="'var(--c-avatar-' + tone + '-fg)'"
      aria-hidden="true"
    >
      @if (initials) {
        {{ initials }}
      } @else {
        <mat-icon fontIcon="person" [class]="size > 60 ? 'icon-xl' : ''"></mat-icon>
      }
    </div>
  `,
})
export class AvatarComponent {
  @Input() initials = '';
  @Input() size = 40;

  get tone(): (typeof TONES)[number] {
    if (!this.initials) return 'blue';
    const sum = [...this.initials].reduce((total, ch) => total + ch.charCodeAt(0), 0);
    return TONES[sum % TONES.length];
  }
}
