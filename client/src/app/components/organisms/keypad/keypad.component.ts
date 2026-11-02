import { Component, Output, EventEmitter } from '@angular/core';
import { KeypadButtonComponent } from '../../atoms/keypad-button.component';

@Component({
  selector: 'app-keypad',
  standalone: true,
  imports: [KeypadButtonComponent],
  templateUrl: './keypad.component.html'
})
export class KeypadComponent {
  keys = [
    { digit: '1', letters: '' },
    { digit: '2', letters: 'ABC' },
    { digit: '3', letters: 'DEF' },
    { digit: '4', letters: 'GHI' },
    { digit: '5', letters: 'JKL' },
    { digit: '6', letters: 'MNO' },
    { digit: '7', letters: 'PQRS' },
    { digit: '8', letters: 'TUV' },
    { digit: '9', letters: 'WXYZ' },
    { digit: '*', letters: '' },
    { digit: '0', letters: '+' },
    { digit: '#', letters: '' },
  ];

  @Output() press = new EventEmitter<string>();

  onKeyPress(key: string) {
    this.press.emit(key);
  }

  // Holding 0 types "+"; holding any other key still types it.
  onLongPress(key: string) {
    this.press.emit(key === '0' ? '+' : key);
  }
}
