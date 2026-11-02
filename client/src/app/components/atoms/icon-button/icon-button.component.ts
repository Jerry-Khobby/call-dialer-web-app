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
      class="flex flex-col items-center justify-center text-center text-white disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
      [disabled]="disabled"
      [attr.aria-pressed]="toggle ? active : null"
      (click)="pressed.emit()"
    >
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center transition"
        [ngClass]="active ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'"
      >
        <mat-icon [fontIcon]="icon" class="icon-lg"></mat-icon>
      </div>
      <span class="text-xs mt-1.5 opacity-80">{{ label }}</span>
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
