import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextComponent } from '../../atoms/text/text.component';
import { TimestampComponent } from '../../atoms/timestamp/timestamp.component';

@Component({
  selector: 'app-call-row',
  template: `
    <div class="flex items-center justify-between py-3 border-b border-gray-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700">
          {{ name.charAt(0) }}
        </div>
        <div class="flex flex-col">
          <app-text
            [text]="displayName"
            [color]="type === 'missed' ? 'text-red-500' : 'text-gray-900'"
            weight="font-semibold"
            size="text-base"
          ></app-text>
        </div>
      </div>
      <app-timestamp [time]="time"></app-timestamp>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, TextComponent, TimestampComponent],
})
export class CallRowComponent {
  @Input() name = '';
  @Input() count = 1;
  @Input() time = '';
  @Input() type: 'missed' | 'answered' = 'answered';

  get displayName() {
    return this.count > 1 ? `${this.name} (${this.count})` : this.name;
  }
}
