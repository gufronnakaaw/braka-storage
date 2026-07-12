export class AppError extends Error {
  status_code: number;
  errors: unknown | null;

  constructor(name: string, message: string, status_code: number, errors: unknown | null = null) {
    super(message);
    this.name = name;
    this.status_code = status_code;
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", errors: unknown | null = null) {
    super("NotFoundError", message, 404, errors);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", errors: unknown | null = null) {
    super("ValidationError", message, 422, errors);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action", errors: unknown | null = null) {
    super("ForbiddenError", message, 403, errors);
  }
}
