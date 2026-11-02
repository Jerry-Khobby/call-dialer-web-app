import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification/notification.service';
import { ContactService } from '../../../core/services/contacts/contact.service';
import { fullName, initials } from '../../../core/services/contacts/contact.model';
import { isValidPhone } from '../../../core/utils/phone';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';

/** Create (/contacts/new?phone=...) or edit (/contacts/:id/edit?phone=...) a contact. */
@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [MatIconModule, FormsModule, RouterLink, AvatarComponent],
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.css']
})
export class ContactFormComponent {
  #router = inject(Router);
  #contactService = inject(ContactService);
  #notificationService = inject(NotificationService);

  editingId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  #prefillPhone = inject(ActivatedRoute).snapshot.queryParamMap.get('phone');

  firstName = signal('');
  lastName = signal('');
  phone = signal('');
  submitted = signal(false);
  confirmingDelete = signal(false);

  fullName = fullName;
  initials = initials;

  firstNameError = computed(() => (this.firstName().trim() ? '' : 'First name is required.'));
  phoneError = computed(() => {
    const phone = this.phone().trim();
    if (!phone) return 'Phone number is required.';
    if (!isValidPhone(phone)) return 'Enter 3–15 digits (spaces, dashes and a leading + are fine).';
    return '';
  });

  /** Another contact already saved with this number. */
  duplicate = computed(() => {
    if (this.phoneError()) return undefined;
    const match = this.#contactService.findByPhone(this.phone());
    return match && match.id !== this.editingId ? match : undefined;
  });

  canSave = computed(() => !this.firstNameError() && !this.phoneError() && !this.duplicate());

  constructor() {
    if (this.editingId) {
      const contact = this.#contactService.getById(this.editingId);
      if (!contact) {
        this.#router.navigate(['/contacts']);
        return;
      }
      this.firstName.set(contact.firstName);
      this.lastName.set(contact.lastName);
      this.phone.set(contact.phoneNumber);
    }
    // "Add Number" from the keypad pre-fills (or replaces) the phone number.
    if (this.#prefillPhone) this.phone.set(this.#prefillPhone);
  }

  cancel() {
    if (this.editingId) this.#router.navigate(['/contacts', this.editingId]);
    else this.#router.navigate([this.#prefillPhone ? '/keypad' : '/contacts']);
  }

  done() {
    this.submitted.set(true);
    if (!this.canSave()) return;

    const input = { firstName: this.firstName(), lastName: this.lastName(), phoneNumber: this.phone() };
    if (this.editingId) {
      this.#contactService.update(this.editingId, input);
      this.#notificationService.showNotification('Contact updated.', 'success');
      this.#router.navigate(['/contacts', this.editingId]);
    } else {
      const contact = this.#contactService.add(input);
      this.#notificationService.showNotification('Contact saved.', 'success');
      this.#router.navigate(['/contacts', contact.id]);
    }
  }

  deleteContact() {
    if (!this.editingId) return;
    this.#contactService.remove(this.editingId);
    this.#notificationService.showNotification('Contact deleted.', 'info');
    this.#router.navigate(['/contacts']);
  }
}
