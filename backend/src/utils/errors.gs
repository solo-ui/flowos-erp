// ══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING UTILITY MODULE
// Custom error classes and error handling utilities
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Custom Application Error
 */
class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      error: true,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp
    };
  }
}

/**
 * Validation Error
 */
class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.field = field;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field
    };
  }
}

/**
 * Not Found Error
 */
class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }
}

/**
 * Authentication Error
 */
class AuthError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

/**
 * API Error (for external service calls)
 */
class APIError extends AppError {
  constructor(service, message, details = null) {
    super(`${service} API error: ${message}`, 'API_ERROR', 503);
    this.name = 'APIError';
    this.service = service;
    this.details = details;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      service: this.service,
      details: this.details
    };
  }
}

/**
 * Safe error response
 * @param {Error} error - Error object
 * @return {object} Safe error response
 */
function createErrorResponse(error) {
  if (error instanceof AppError) {
    logError(error.message, error);
    return error.toJSON();
  }

  logError('Unexpected error', error);
  return {
    error: true,
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    timestamp: new Date().toISOString()
  };
}

/**
 * Wrap async operation with error handling
 * @param {function} fn - Async function
 * @param {string} context - Operation context
 * @return {function} Wrapped function
 */
function withErrorHandling(fn, context = 'Operation') {
  return function(...args) {
    try {
      const result = fn.apply(this, args);
      if (result && typeof result.catch === 'function') {
        return result.catch(error => {
          logError(`${context} failed`, error);
          throw createErrorResponse(error);
        });
      }
      return result;
    } catch (error) {
      logError(`${context} failed`, error);
      throw createErrorResponse(error);
    }
  };
}

/**
 * Validate required fields
 * @param {object} data - Data object
 * @param {array} fields - Required field names
 * @throw {ValidationError}
 */
function validateRequired(data, fields) {
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      throw new ValidationError(`Missing required field: ${field}`, field);
    }
  }
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @throw {ValidationError}
 */
function validateEmail(email) {
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
}

/**
 * Validate phone format (basic)
 * @param {string} phone - Phone number
 * @throw {ValidationError}
 */
function validatePhone(phone) {
  const phoneRegex = /^[+]?[\d\s\-()]{7,}$/;
  if (!phoneRegex.test(phone)) {
    throw new ValidationError('Invalid phone format', 'phone');
  }
}

/**
 * Validate data type
 * @param {*} value - Value to validate
 * @param {string} type - Expected type
 * @param {string} fieldName - Field name for error
 * @throw {ValidationError}
 */
function validateType(value, type, fieldName) {
  if (typeof value !== type) {
    throw new ValidationError(
      `Field ${fieldName} must be of type ${type}`,
      fieldName
    );
  }
}

/**
 * Handle API errors safely
 * @param {object} response - API response
 * @param {string} service - Service name
 * @throw {APIError}
 */
function checkAPIResponse(response, service = 'External API') {
  if (!response || response.getResponseCode && response.getResponseCode() >= 400) {
    throw new APIError(
      service,
      `HTTP ${response.getResponseCode()}`,
      response.getContentText()
    );
  }
  return response;
}
