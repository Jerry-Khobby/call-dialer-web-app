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

severityClasses: Record<NotificationSeverity, string> = {
  success: 'bg-green-500/15 border-green-400/30 text-green-200',
  info: 'bg-blue-500/15 border-blue-400/30 text-blue-200',
  warning: 'bg-amber-500/15 border-amber-400/30 text-amber-200',
  error: 'bg-red-500/15 border-red-400/30 text-red-200',
};

onClose(){
  this.notificationService.clear();
}
}
