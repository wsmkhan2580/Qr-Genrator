import { Errors } from '../utils/errors.js';

/**
 * Validates req[source] against a Zod schema, replacing it with the
 * parsed (and coerced/trimmed) value on success. On failure, forwards a
 * structured 422 with per-field messages - never trusts client-side
 * validation alone.
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(Errors.validation('Validation failed.', details));
    }
    req[source] = result.data;
    next();
  };
}
