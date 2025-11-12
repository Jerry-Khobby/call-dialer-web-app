import { Input,Component } from "@angular/core";
@Component({
  selector:'app-text',
  templateUrl:'./text.component.html',
  styleUrls:['./text.component.css']
})

export class TextComponent{
  @Input() text ='';
  @Input() color ='text-gray-900';
  @Input() weight ='font-normal';
  @Input() size = 'text-sm';
}
