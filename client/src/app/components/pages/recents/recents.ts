import { Component } from '@angular/core';
import { RecentsTemplateComponent } from '../../templates/recents-template/recents-template.component';
import { CommonModule } from '@angular/common';
import { TabBar } from '../../organisms/tab-bar/tab-bar';

@Component({
  selector: 'app-recents',
  template: `<app-recents-template [calls]="recentCalls"></app-recents-template>
  <app-tab-bar></app-tab-bar>
  
  `,
  imports:[CommonModule,RecentsTemplateComponent,TabBar]
})
export class RecentsComponent {
  recentCalls = [
    { id: 1, name: 'John Doe', count: 3, time: '2:15 PM', type: 'answered' },
    { id: 2, name: 'Sarah Mensah', count: 1, time: '1:04 PM', type: 'missed' },
    { id: 3, name: 'Michael Aboagye', count: 2, time: '10:42 AM', type: 'answered' },
    { id: 4, name: 'Peter Okoro', count: 1, time: 'Yesterday', type: 'missed' },
  ];
}
