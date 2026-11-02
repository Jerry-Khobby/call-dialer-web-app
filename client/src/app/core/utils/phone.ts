/** Keeps only what a phone can dial: digits, * and #, plus a single leading +. */
export function sanitizePhone(input: string): string {
  const cleaned = input.replace(/[^0-9*#+]/g, '');
  return cleaned.charAt(0) + cleaned.slice(1).replace(/\+/g, '');
}

/** Digits only, so numbers can be compared regardless of spaces, dashes or brackets. */
export function normalizePhone(input: string): string {
  return input.replace(/\D/g, '');
}

export function samePhone(a: string, b: string): boolean {
  const x = normalizePhone(a);
  return x.length > 0 && x === normalizePhone(b);
}

/** A number worth dialing: at least 3 dialable characters (covers short codes like *123#). */
export function isDialable(input: string): boolean {
  return sanitizePhone(input).replace('+', '').length >= 3;
}

/** A number worth saving on a contact: 3–15 digits, optional leading +, common separators allowed. */
export function isValidPhone(input: string): boolean {
  const value = input.trim();
  const digits = normalizePhone(value).length;
  return /^\+?[0-9\s().-]+$/.test(value) && digits >= 3 && digits <= 15;
}

/** Groups digits in threes for readability, e.g. 0241234567 -> 024 123 4567. */
export function formatPhone(input: string): string {
  if (/[*#]/.test(input)) return input; // service codes are shown exactly as typed

  const plus = input.startsWith('+') ? '+' : '';
  const groups = normalizePhone(input).match(/.{1,3}/g) ?? [];
  const last = groups.length - 1;
  if (last > 0 && groups[last].length === 1) {
    groups[last - 1] += groups[last];
    groups.pop();
  }
  return plus + groups.join(' ');
}
