import { Input,Component } from "@angular/core";
@Component({
  selector:'app-timestamp',
  template:`<span class="text-xs text-gray-500"> {{time}}</span>`,

})


export class TimestampComponent{
  @Input() time='';
}