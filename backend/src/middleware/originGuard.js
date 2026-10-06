import { env } from '../config/env.js';
import { Errors } from '../utils/errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defense for cookie-authenticated APIs. Browsers always attach an
 * Origin header to cross-origin state-changing requests, so we reject any
 * POST/PUT/PATCH/DELETE whose Origin isn't our own frontend.
 *
 * This matters because production cookies are SameSite=None (frontend and
 * API live on different domains), which would otherwise let a malicious
 * site trigger authenticated writes in a victim's browser.
 *
 * Requests with no Origin header (curl, server-to-server, tests) are not
 * browser CSRF vectors and are allowed through.
 */
export function createOriginGuard(allowedOrigins = env.clientUrls) {
  const allowed = new Set(allowedOrigins);
  return function originGuard(req, _res, next) {
    if (SAFE_METHODS.has(req.method)) return next();
    const origin = req.headers.origin;
    if (!origin) return next();
    if (allowed.has(origin)) return next();
    return next(Errors.forbidden('Request origin is not allowed.'));
  };
}

export const originGuard = createOriginGuard();
