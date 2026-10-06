import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Errors } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { findUserById } from '../modules/users/user.repository.js';

/**
 * Requires a valid session. Populates req.user with { id, email, role,
 * isActive }. Never trusts a stale/cached role - re-reads the user's
 * current role/active status from the DB on every request so a
 * deactivated account or a demoted role takes effect immediately.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[env.cookieName];
  if (!token) throw Errors.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw Errors.unauthorized('Session expired or invalid. Please log in again.');
  }

  const user = await findUserById(payload.sub);
  if (!user || !user.isActive) {
    throw Errors.unauthorized('Your account is not active. Contact an administrator.');
  }

  req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
  next();
});

/**
 * Role-gate middleware factory. Backend is the source of truth for
 * authorization - frontend route guards are a UX convenience only.
 */
export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) return next(Errors.unauthorized());
    if (!allowedRoles.includes(req.user.role)) {
      return next(Errors.forbidden());
    }
    next();
  };
}
