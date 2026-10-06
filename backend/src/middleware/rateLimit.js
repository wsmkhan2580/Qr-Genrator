import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { Errors } from '../utils/errors.js';

function jsonRateLimitHandler(_req, _res, next) {
  next(Errors.rateLimited());
}

// Tighter limit on auth endpoints to blunt brute-force credential guessing.
export const authRateLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
  skip: () => env.isTest,
});

// General API limit to reduce abuse/scraping.
export const apiRateLimiter = rateLimit({
  windowMs: env.apiRateLimitWindowMs,
  max: env.apiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
  skip: () => env.isTest,
});
