import { Component, Input, Output, EventEmitter } from '@angular/core';
import { LongPressDirective } from './long-press.directive';

@Component({
  selector: 'app-keypad-button',
  imports: [LongPressDirective],
  templateUrl: './keypad-button.component.html'
})
export class KeypadButtonComponent {
  @Input() label!: string;
  @Input() letters = '';
  @Output() clicked = new EventEmitter<string>();
  @Output() longPressed = new EventEmitter<string>();
}
