import { Transform } from 'class-transformer';
import { ValidateIf } from 'class-validator';

/**
 * Trims strings before validation, so "   " fails @IsNotEmpty (instead of passing and
 * then failing in the database as a 500) and " a@b.com " is accepted as "a@b.com".
 */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

/**
 * Like @IsOptional(), but only for a missing field: `null` still goes through the other
 * validators and is rejected, rather than being written to the database.
 */
export const Optional = () =>
  ValidateIf((_object: object, value: unknown) => value !== undefined);
