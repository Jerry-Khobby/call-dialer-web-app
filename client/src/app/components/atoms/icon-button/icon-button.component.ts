import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <button
      class="flex flex-col items-center justify-center text-center text-white"
    >
      <div
        class="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
      >
        <mat-icon [fontIcon]="icon" class="text-lg"></mat-icon>
      </div>
      <span class="text-[11px] mt-1 opacity-80">{{ label }}</span>
    </button>
  `,
})
export class IconButtonComponent {
  @Input() icon!: string;
  @Input() label!: string;
}
