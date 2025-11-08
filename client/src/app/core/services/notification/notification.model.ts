export type NotificationSeverity ='error'|'warning' | 'info' | 'success';



export type Notification ={
  severity:NotificationSeverity;
  text:string;
}