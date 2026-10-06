/**
 * Wraps an async Express route handler so thrown/rejected errors are
 * forwarded to next() instead of crashing the process or hanging the
 * request.
 */
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
