import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallRowComponent } from '../../molecules/call-row/call-row.component';

interface Call {
  id: number;
  name: string;
  count: number;
  time: string;
  type: 'missed' | 'answered';
}

@Component({
  selector: 'app-call-list',
  template: `
    <div class="divide-y divide-gray-100">
      <app-call-row
        *ngFor="let call of calls"
        [name]="call.name"
        [count]="call.count"
        [time]="call.time"
        [type]="call.type"
      ></app-call-row>
    </div>
  `,
  imports:[CommonModule,CallRowComponent]
})
export class CallListComponent {
  @Input() calls: Call[] = [];
}
