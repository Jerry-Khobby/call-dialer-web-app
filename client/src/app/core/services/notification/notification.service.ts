import { Injectable,signal } from "@angular/core";
import { Notification,NotificationSeverity } from "./notification.model";


@Injectable({
  providedIn:'root',
})

export class NotificationService{
  #notificationSignal = signal<Notification | null >(null);

  notification = this.#notificationSignal.asReadonly();



  showNotification(text:string,severity:NotificationSeverity){
    this.#notificationSignal.set({
      text,
      severity,
    })
  }

  clear(){
    this.#notificationSignal.set(null);
  }
}