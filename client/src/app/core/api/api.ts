import { HttpErrorResponse } from '@angular/common/http';

/** The NestJS API: same origin in production, forwarded by proxy.conf.js in development. */
export const API = '/api';

/**
 * A message fit to show the user, from an API error (`{ message: string | string[] }`)
 * or a network failure.
 */
export function apiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 0) return "Can't reach the server. Check your connection and try again.";

  const message: unknown = (error.error as { message?: unknown } | null)?.message;
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  if (typeof message === 'string') return message;
  return fallback;
}
