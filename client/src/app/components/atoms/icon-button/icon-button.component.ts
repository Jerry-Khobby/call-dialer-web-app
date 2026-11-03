import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <button
      type="button"
      class="group flex flex-col items-center justify-center gap-2 text-center disabled:cursor-not-allowed cursor-pointer"
      [disabled]="disabled"
      [attr.aria-pressed]="toggle ? active : null"
      (click)="pressed.emit()"
    >
      <span
        class="w-[72px] h-[72px] rounded-full flex items-center justify-center transition"
        [ngClass]="
          disabled
            ? 'bg-raised/60 text-disabled'
            : active
              ? 'bg-fg text-bg'
              : 'bg-raised text-fg group-hover:brightness-110'
        "
      >
        <mat-icon [fontIcon]="icon" class="icon-lg"></mat-icon>
      </span>
      <span class="text-[13px] font-semibold" [ngClass]="disabled ? 'text-subtle' : 'text-label'">{{ label }}</span>
    </button>
  `,
})
export class IconButtonComponent {
  @Input() icon!: string;
  @Input() label!: string;
  @Input() active = false;
  /** Set for on/off buttons (mute, speaker) so screen readers announce the state. */
  @Input() toggle = false;
  @Input() disabled = false;
  @Output() pressed = new EventEmitter<void>();
}
