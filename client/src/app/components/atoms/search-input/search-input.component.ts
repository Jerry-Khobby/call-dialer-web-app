import { Component,EventEmitter,Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";


@Component({
  selector:'app-search-input',
  standalone:true,
  imports:[CommonModule,FormsModule,MatIconModule],
  templateUrl:'./search-input.component.html',

})

export class SearchInputComponent{
  search ='';
  @Output() onSearch = new EventEmitter<string>();
}