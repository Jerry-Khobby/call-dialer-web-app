import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

/** Password field with an eye button to show or hide what was typed. */
@Component({
  selector: 'app-password-input',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <div class="field pr-1" [class.field-invalid]="invalid">
      <input
        [id]="inputId"
        [type]="visible() ? 'text' : 'password'"
        [name]="name"
        [placeholder]="placeholder"
        [attr.autocomplete]="autocomplete"
        [attr.aria-invalid]="invalid || null"
        [attr.aria-describedby]="describedBy || null"
        [ngModel]="value"
        (ngModelChange)="valueChange.emit($event)"
        autocapitalize="off"
        spellcheck="false"
      />
      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-muted hover:text-fg cursor-pointer"
        [attr.aria-label]="visible() ? 'Hide password' : 'Show password'"
        [attr.aria-pressed]="visible()"
        [attr.aria-controls]="inputId"
        (click)="visible.set(!visible())"
      >
        <mat-icon [fontIcon]="visible() ? 'visibility_off' : 'visibility'" class="icon-md"></mat-icon>
      </button>
    </div>
  `,
})
export class PasswordInputComponent {
  @Input() inputId = 'password';
  @Input() name = 'password';
  @Input() placeholder = '';
  @Input() autocomplete = 'current-password';
  @Input() invalid = false;
  @Input() describedBy = '';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  visible = signal(false);
}
