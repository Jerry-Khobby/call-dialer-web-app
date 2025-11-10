import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeypadComponent } from '../../organisms/keypad/keypad.component';
import { TabBar } from '../../organisms/tab-bar/tab-bar';
import { MatIconModule } from '@angular/material/icon';
import {Router} from "@angular/router"
@Component({
  selector: 'app-keypad-page',
  standalone: true,
  imports: [CommonModule,MatIconModule, KeypadComponent, TabBar],
  templateUrl: './keypad.page.html',
  styleUrl:'./keypad.page.css'
})
export class KeypadPage {
  constructor(private router:Router){}
  typedNumber = '';
  isPopping = false;

  addDigit(key: string) {
    this.typedNumber += key;

     this.isPopping = true;
     setTimeout(()=>(this.isPopping=false),180)
  }

  clearLastDigit(){
    this.typedNumber = this.typedNumber.slice(0,-1);
  }

 //I want to defined the function for routing the user 
goToNewContact() {
  this.router.navigate(['/new-contact'], { state: { phone: this.typedNumber } });
}


callThisNumber(){
  if(this.typedNumber.length>=3){
    this.router.navigate(['/call',this.typedNumber])
  }
}

}
