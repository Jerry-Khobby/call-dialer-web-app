import { Component,inject } from "@angular/core";


import { NotificationService } from "../../core/services/notification/notification.service";
import { NgClass } from "@angular/common";

@Component({
  selector:'app-notification',
  templateUrl:'./notification.component.html',
  styleUrls:['./notification.component.css'],
  imports:[NgClass],
})

export class NotificationComponent{
notificationService = inject(NotificationService);
notification = this.notificationService.notification;


onClose(){
  this.notificationService.clear();
}
}