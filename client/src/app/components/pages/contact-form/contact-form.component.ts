import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification/notification.service';
import { ContactService } from '../../../core/services/contacts/contact.service';
import { fullName, initials } from '../../../core/services/contacts/contact.model';
import { isValidPhone } from '../../../core/utils/phone';
import { apiErrorMessage } from '../../../core/api/api';
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
  busy = signal(false);

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
    // "Add Number" from the keypad pre-fills (or replaces) the phone number.
    if (this.#prefillPhone) this.phone.set(this.#prefillPhone);
    if (this.editingId) void this.#loadContact(this.editingId);
  }

  /** The form may be opened directly, before the contact list has loaded. */
  async #loadContact(id: string) {
    await this.#contactService.ready().catch(() => undefined);
    const contact = this.#contactService.getById(id);
    if (!contact) {
      this.#router.navigate(['/contacts']);
      return;
    }
    this.firstName.set(contact.firstName);
    this.lastName.set(contact.lastName);
    if (!this.#prefillPhone) this.phone.set(contact.phoneNumber);
  }

  cancel() {
    if (this.editingId) this.#router.navigate(['/contacts', this.editingId]);
    else this.#router.navigate([this.#prefillPhone ? '/keypad' : '/contacts']);
  }

  async done() {
    this.submitted.set(true);
    if (!this.canSave() || this.busy()) return;

    const input = {
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      phoneNumber: this.phone().trim(),
    };
    await this.#save(async () => {
      if (this.editingId) {
        await this.#contactService.update(this.editingId, input);
        this.#notificationService.showNotification('Contact updated.', 'success');
        this.#router.navigate(['/contacts', this.editingId]);
      } else {
        const contact = await this.#contactService.add(input);
        this.#notificationService.showNotification('Contact saved.', 'success');
        this.#router.navigate(['/contacts', contact.id]);
      }
    });
  }

  async deleteContact() {
    const id = this.editingId;
    if (!id || this.busy()) return;
    await this.#save(async () => {
      await this.#contactService.remove(id);
      this.#notificationService.showNotification('Contact deleted.', 'info');
      this.#router.navigate(['/contacts']);
    });
  }

  /** Runs a server request, showing its error (e.g. a duplicate number) if it fails. */
  async #save(request: () => Promise<void>) {
    this.busy.set(true);
    try {
      await request();
    } catch (error) {
      this.#notificationService.showNotification(apiErrorMessage(error), 'error');
    } finally {
      this.busy.set(false);
    }
  }
}
