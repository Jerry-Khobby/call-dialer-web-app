import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Round avatar with the contact's initials, or a person icon for unknown numbers. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div
      class="rounded-full bg-gradient-to-b from-white/25 to-white/10 text-white font-medium flex items-center justify-center select-none"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.font-size.px]="size * 0.4"
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
}
