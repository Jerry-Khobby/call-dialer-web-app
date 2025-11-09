import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification/notification.service';

@Component({
  selector: 'app-new-contact',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './new-contact.component.html',
  styleUrls: ['./new-contact.component.css']
})
export class NewContactComponent {
  firstName = '';
  lastName = '';
  phone = '';

  constructor(private router: Router, private notificationService: NotificationService) {
    const nav = history.state;
    if (nav?.phone) this.phone = nav.phone;
  }

  cancel() {
    this.router.navigate(['/keypad']);
  }

  done() {
    if (!this.firstName.trim()) {
      this.notificationService.showNotification('Please enter a first name.', 'warning');
      return;
    }

    this.notificationService.showNotification('Contact saved successfully ✅', 'success');
    this.router.navigate(['/keypad']);
  }
}
