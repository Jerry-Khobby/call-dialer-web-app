import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-item.component.html',
})
export class ContactItemComponent {
  @Input() contact!: { name: string; phone: string };
}
