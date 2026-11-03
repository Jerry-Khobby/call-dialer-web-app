import { Component,inject } from "@angular/core";


import { NotificationService } from "../../core/services/notification/notification.service";
import { NotificationSeverity } from "../../core/services/notification/notification.model";
import { NgClass } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector:'app-notification',
  templateUrl:'./notification.component.html',
  styleUrls:['./notification.component.css'],
  imports:[NgClass, MatIconModule],
})

export class NotificationComponent{
notificationService = inject(NotificationService);
notification = this.notificationService.notification;

// A solid card in both themes; the icon carries the colour (and the meaning).
severityIcons: Record<NotificationSeverity, { icon: string; color: string }> = {
  success: { icon: 'check_circle', color: 'var(--c-accent-fg)' },
  info: { icon: 'info', color: 'var(--c-link)' },
  warning: { icon: 'warning', color: 'var(--c-warn-fg)' },
  error: { icon: 'error', color: 'var(--c-danger-fg)' },
};

onClose(){
  this.notificationService.clear();
}
}
