import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeypadButtonComponent } from '../../atoms/keypad-button.component';

@Component({
  selector: 'app-keypad',
  standalone: true,
  imports: [CommonModule, KeypadButtonComponent],
  templateUrl: './keypad.component.html'
})
export class KeypadComponent {
  keys = ['1','2','3','4','5','6','7','8','9','*','0','#'];

  @Output() press = new EventEmitter<string>();

  onKeyPress(key: string) {
    this.press.emit(key);
  }
}
