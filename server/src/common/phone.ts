import { registerDecorator, ValidationOptions } from 'class-validator';

// Same rules as the client (client/src/app/core/utils/phone.ts), so both sides agree.

/** Digits only, so numbers compare equal regardless of spaces, dashes or brackets. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** 3–15 digits, optional leading +, common separators allowed. */
export function isValidPhone(phone: string): boolean {
  const digits = phoneDigits(phone).length;
  return /^\+?[0-9\s().-]+$/.test(phone.trim()) && digits >= 3 && digits <= 15;
}

export function IsPhone(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isPhone',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be 3–15 digits (spaces, dashes, brackets and a leading + are allowed)`,
        ...options,
      },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isValidPhone(value),
      },
    });
}

/** Anything a phone can dial, including service codes like *123#. */
export const DIALABLE = /^[0-9+*#\s().-]+$/;
