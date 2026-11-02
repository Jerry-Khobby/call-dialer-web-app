// Mirrors the server's Contact schema (minus userId), plus the client-side favorite flag.
export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  favorite: boolean;
};

export type ContactInput = Pick<Contact, 'firstName' | 'lastName' | 'phoneNumber'>;

export function fullName(contact: Pick<Contact, 'firstName' | 'lastName'>): string {
  return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
}

export function initials(contact: Pick<Contact, 'firstName' | 'lastName'>): string {
  return (contact.firstName.charAt(0) + contact.lastName.charAt(0)).toUpperCase();
}
