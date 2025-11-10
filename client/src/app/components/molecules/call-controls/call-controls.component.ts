import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconButtonComponent } from '../../atoms/icon-button/icon-button.component';

@Component({
  selector: 'app-call-controls',
  standalone: true,
  imports: [CommonModule, IconButtonComponent],
  template: `
    <div class="grid grid-cols-3 gap-6 mt-10 text-center">
      <app-icon-button icon="volume_up" label="Speaker"></app-icon-button>
      <app-icon-button icon="mic_off" label="Mute"></app-icon-button>
      <app-icon-button icon="dialpad" label="Keypad"></app-icon-button>
      <app-icon-button icon="add" label="Add Call"></app-icon-button>
      <app-icon-button icon="videocam" label="FaceTime"></app-icon-button>
      <app-icon-button icon="person" label="Contacts"></app-icon-button>
    </div>
  `,
})
export class CallControlsComponent {}
