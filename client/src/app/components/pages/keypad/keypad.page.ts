import { Component } from '@angular/core';

@Component({
  selector: 'app-keypad-page',
  templateUrl: './keypad.page.html'
})
export class KeypadPage {
  typedNumber = '';

  addDigit(key: string) {
    this.typedNumber += key;
  }
}
