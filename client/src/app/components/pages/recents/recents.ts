import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TabBar } from '../../organisms/tab-bar/tab-bar';

@Component({
  selector: 'app-recents-page',
  standalone: true,
  styleUrls: ['./recents.css'],
  imports: [CommonModule, MatIconModule, TabBar],
  templateUrl: './recents.html',
})
export class RecentsPage {
  constructor(private router: Router) {}

  rawRecents = [
    { name: 'Alice Johnson', type: 'missed', time: '2m ago' },
    { name: 'Ben Adams', type: 'incoming', time: '10m ago' },
    { name: 'Chris Smith', type: 'outgoing', time: '1h ago' },
    { name: 'Daniel White', type: 'missed', time: 'Yesterday' },
    { name: 'Daniel White', type: 'missed', time: 'Yesterday' },
    { name: 'Daniel White', type: 'missed', time: 'Yesterday' },
  ];

  recents = this.groupRecents(this.rawRecents);

  groupRecents(list: any[]) {
    const grouped: any = {};

    list.forEach(item => {
      if (!grouped[item.name]) {
        grouped[item.name] = { ...item, count: 1 };
      } else {
        grouped[item.name].count++;
      }
    });

    return Object.values(grouped);
  }

  startCall(recent: any) {
    this.router.navigate(['/call', recent.name]);
  }
}
