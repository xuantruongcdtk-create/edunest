export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', id ? `${resource} '${id}' not found` : `${resource} not found`, 404)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403)
    this.name = 'ForbiddenError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 422, details)
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends AppError {
  constructor(public readonly retryAfterSeconds: number) {
    super('RATE_LIMITED', `Rate limit exceeded. Retry after ${retryAfterSeconds}s`, 429)
    this.name = 'RateLimitError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409)
    this.name = 'ConflictError'
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: unknown) {
    super('PAYMENT_ERROR', message, 402, details)
    this.name = 'PaymentError'
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError
}
