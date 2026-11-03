import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconButtonComponent } from '../../atoms/icon-button/icon-button.component';

@Component({
  selector: 'app-call-controls',
  standalone: true,
  imports: [CommonModule, IconButtonComponent],
  template: `
    <div class="grid grid-cols-3 gap-x-8 gap-y-6 text-center">
      <app-icon-button
        [icon]="muted ? 'mic_off' : 'mic'"
        label="Mute"
        [toggle]="true"
        [active]="muted"
        [disabled]="disabled"
        (pressed)="muteToggled.emit()"
      ></app-icon-button>
      <app-icon-button
        icon="dialpad"
        label="Keypad"
        [disabled]="disabled"
        (pressed)="keypadOpened.emit()"
      ></app-icon-button>
      <!-- Browsers don't let a web page switch between earpiece and loudspeaker. -->
      <app-icon-button icon="volume_up" label="Speaker" [disabled]="true"></app-icon-button>
      <!-- Not supported yet: in-app calls are one-to-one audio. -->
      <app-icon-button icon="add_call" label="Add Call" [disabled]="true"></app-icon-button>
      <app-icon-button icon="videocam" label="Video" [disabled]="true"></app-icon-button>
      <app-icon-button icon="person" label="Contacts" [disabled]="true"></app-icon-button>
    </div>
  `,
})
export class CallControlsComponent {
  @Input() muted = false;
  @Input() disabled = false;
  @Output() muteToggled = new EventEmitter<void>();
  @Output() keypadOpened = new EventEmitter<void>();
}
