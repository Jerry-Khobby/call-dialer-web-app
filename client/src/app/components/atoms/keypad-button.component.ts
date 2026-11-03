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

  get isSymbol() {
    return this.label === '*' || this.label === '#';
  }

  // Glyphs don't sit in the middle of their line box: * is drawn small and near the top,
  // so it's enlarged and nudged down to land in the middle of the circle (# needs nothing).
  get symbolClass() {
    return this.label === '*'
      ? 'leading-none text-5xl translate-y-[0.18em]'
      : 'leading-none text-3xl';
  }
}
