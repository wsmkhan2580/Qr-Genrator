import { Errors } from '../../utils/errors.js';

/**
 * Account-management rules, kept as a pure function so they can be unit
 * tested without a database.
 *
 *  - Only ADMINs create or modify accounts (managers may list workers).
 *  - Nobody can change their own role or active flag. This blocks
 *    self-promotion and accidentally locking yourself out.
 */
export function assertCanModifyUser(actor, targetUserId, updates = {}) {
  if (!actor || actor.role !== 'ADMIN') {
    throw Errors.forbidden('Only administrators can manage accounts.');
  }
  const touchesPrivilegedFields = updates.role !== undefined || updates.isActive !== undefined;
  if (actor.id === targetUserId && touchesPrivilegedFields) {
    throw Errors.forbidden('You cannot change your own role or active status.');
  }
}
