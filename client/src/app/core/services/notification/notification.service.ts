import { Injectable,signal } from "@angular/core";
import { Notification,NotificationSeverity } from "./notification.model";

const AUTO_DISMISS_MS = 3000;

@Injectable({
  providedIn:'root',
})

export class NotificationService{
  #notificationSignal = signal<Notification | null >(null);
  #dismissTimer?: ReturnType<typeof setTimeout>;

  notification = this.#notificationSignal.asReadonly();



  showNotification(text:string,severity:NotificationSeverity){
    this.#notificationSignal.set({
      text,
      severity,
    })
    clearTimeout(this.#dismissTimer);
    this.#dismissTimer = setTimeout(() => this.clear(), AUTO_DISMISS_MS);
  }

  clear(){
    clearTimeout(this.#dismissTimer);
    this.#notificationSignal.set(null);
  }
}
