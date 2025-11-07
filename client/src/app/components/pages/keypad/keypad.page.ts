import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeypadComponent } from '../../organisms/keypad/keypad.component';
import { TabBar } from '../../organisms/tab-bar/tab-bar';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-keypad-page',
  standalone: true,
  imports: [CommonModule,MatIconModule, KeypadComponent, TabBar],
  templateUrl: './keypad.page.html'
})
export class KeypadPage {
  typedNumber = '';

  addDigit(key: string) {
    this.typedNumber += key;
  }
}
