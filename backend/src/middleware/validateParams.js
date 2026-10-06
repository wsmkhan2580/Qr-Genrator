import { z } from 'zod';
import { Errors } from '../utils/errors.js';

const uuidSchema = z.string().uuid();

/**
 * Rejects non-UUID route params with a clean 422 instead of letting
 * PostgreSQL throw "invalid input syntax for type uuid" (which would
 * otherwise surface as a 500).
 */
export function validateUuidParam(name = 'id') {
  return (req, _res, next) => {
    if (!uuidSchema.safeParse(req.params[name]).success) {
      return next(Errors.validation(`Invalid ${name}.`, [{ field: name, message: 'Must be a valid id.' }]));
    }
    next();
  };
}
