import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tab-bar',
  imports: [MatIconModule,RouterModule],
  templateUrl: './tab-bar.html',
  styleUrl: './tab-bar.css',
})
export class TabBar {
  // Same order as a phone's dialer app.
  tabs = [
    { path: '/favorites', label: 'Favorites', icon: 'star' },
    { path: '/recents', label: 'Recents', icon: 'history' },
    { path: '/contacts', label: 'Contacts', icon: 'person' },
    { path: '/keypad', label: 'Keypad', icon: 'dialpad' },
  ];
}
