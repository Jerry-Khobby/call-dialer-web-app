import { ToObjectOptions } from 'mongoose';

/** JSON shape for API responses: `id` instead of `_id`, no `__v`, and internal fields hidden. */
export function apiJson(...hidden: string[]): ToObjectOptions {
  return {
    virtuals: true,
    versionKey: false,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret._id;
      for (const key of hidden) delete ret[key];
      return ret;
    },
  };
}

/** MongoDB unique-index violation (E11000). */
export function isDuplicateKeyError(
  error: unknown,
): error is { code: 11000; keyPattern?: Record<string, unknown> } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}
