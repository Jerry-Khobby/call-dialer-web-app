import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-keypad-button',
  templateUrl: './keypad-button.component.html'
})
export class KeypadButtonComponent {
  @Input() label!: string;
  @Output() clicked = new EventEmitter<string>();
}
