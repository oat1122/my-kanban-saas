/**
 * Custom Error Classes สำหรับ Application
 * ใช้กับ Global Error Handler เพื่อแปลงเป็น HTTP Response อัตโนมัติ
 */

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Invalid input or request
 */
export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(400, message);
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

/**
 * 403 Forbidden - Access denied (IDOR Protection)
 */
export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(403, message);
  }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}

/**
 * 409 Conflict - Resource already exists
 */
export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, message);
  }
}

/**
 * 422 Unprocessable Entity - Validation failed
 */
export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(422, message);
  }
}

/**
 * 500 Internal Server Error - Unexpected error
 */
export class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(500, message, false);
  }
}
