export class AppError extends Error {
  constructor(code, message, statusCode = 400, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const Errors = {
  validation: (message, details) => new AppError('VALIDATION_ERROR', message, 422, details),
  unauthorized: (message = 'Authentication required.') => new AppError('UNAUTHORIZED', message, 401),
  forbidden: (message = 'You do not have permission to perform this action.') =>
    new AppError('FORBIDDEN', message, 403),
  notFound: (message = 'Resource not found.') => new AppError('NOT_FOUND', message, 404),
  conflict: (message = 'Conflicting resource.') => new AppError('CONFLICT', message, 409),
  rateLimited: (message = 'Too many requests. Please try again later.') =>
    new AppError('RATE_LIMITED', message, 429),
  internal: (message = 'An unexpected error occurred.') => new AppError('INTERNAL_ERROR', message, 500),
};
