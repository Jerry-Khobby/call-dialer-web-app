import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallControlsComponent } from '../../molecules/call-controls/call-controls.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-caller-screen',
  standalone: true,
  imports: [CommonModule, MatIconModule, CallControlsComponent],
  template: `
    <div
      class="min-h-screen bg-[#0f0f11] text-white flex flex-col items-center justify-center"
    >
      <div class="flex flex-col items-center">
        <h2 class="text-2xl font-semibold">{{ name }}</h2>
        <p class="text-gray-400 text-sm mt-1">calling…</p>
      </div>

      <app-call-controls></app-call-controls>

      <div class="mt-12">
        <button
          (click)="endCall()"
          class="bg-red-600 hover:bg-red-700 transition text-white rounded-full w-16 h-16 flex items-center justify-center"
        >
          <mat-icon fontIcon="call_end" class="text-xl"></mat-icon>
        </button>
      </div>
    </div>
  `,
})
export class CallerScreenComponent {
  @Input() name!: string;

  endCall() {
    window.history.back(); // just navigate back to contacts
  }
}
