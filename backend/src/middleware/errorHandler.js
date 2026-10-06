import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError('NOT_FOUND', `No route for ${req.method} ${req.originalUrl}`, 404));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    if (!env.isTest && err.statusCode >= 500) {
      // eslint-disable-next-line no-console
      console.error('[AppError]', err.code, err.message, err.stack);
    }
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Unknown/unexpected error: never leak stack traces, SQL errors, etc.
  // eslint-disable-next-line no-console
  console.error('[UnhandledError]', err);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' },
    });
  }

  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
}
