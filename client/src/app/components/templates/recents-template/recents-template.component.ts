import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallListComponent } from '../../organisms/call-list/call-list.component';

@Component({
  selector: 'app-recents-template',
  standalone: true,
  imports: [CommonModule, CallListComponent],
  template: `
    <section class="max-w-md mx-auto mt-10 bg-white rounded-2xl shadow p-6">
      <h2 class="text-2xl font-bold mb-4">Recents</h2>
      <app-call-list [calls]="calls"></app-call-list>
    </section>
  `,
})
export class RecentsTemplateComponent {
  @Input() calls: any[] = [];
}
