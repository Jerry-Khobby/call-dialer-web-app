import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-keypad',
  templateUrl: './keypad.component.html'
})
export class KeypadComponent {
  keys = ['1','2','3','4','5','6','7','8','9','*','0','#'];

  @Output() press = new EventEmitter<string>();

  onKeyPress(key: string) {
    this.press.emit(key);
  }
}
