import { Component } from '@angular/core';

@Component({
  selector: 'app-new-contact',
  templateUrl: './new-contact.component.html',
  styleUrls: ['./new-contact.component.css']
})
export class NewContactComponent {
  phone: string = '';

  constructor() {
    const nav = history.state;
    if (nav && nav.phone) {
      this.phone = nav.phone;
    }
  }
}
