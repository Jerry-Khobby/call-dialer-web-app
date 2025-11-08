import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-contact',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './new-contact.component.html',
  styleUrls: ['./new-contact.component.css']
})
export class NewContactComponent {
  phone: string = '';

  constructor(private router: Router) {
    const nav = history.state;
    if (nav?.phone) this.phone = nav.phone;
  }

  cancel() {
    this.router.navigate(['/keypad']);
  }

  done() {
    alert('Contact Saved');
    this.router.navigate(['/keypad']);
  }
}
