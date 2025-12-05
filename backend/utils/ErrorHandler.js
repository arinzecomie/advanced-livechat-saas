/**
 * Centralized Error Handling and Custom Error Classes
 * 
 * Provides consistent error handling throughout the application
 * with proper logging, validation, and response formatting.
 */

/**
 * Custom Application Error Class
 * Extends native Error with additional properties for API responses
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true, details = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Factory function for creating specific error types
 */
const ErrorFactory = {
  // Authentication errors
  unauthorized: (message = 'Unauthorized', details = null) => 
    new AppError(message, 401, true, details),
  
  forbidden: (message = 'Forbidden', details = null) => 
    new AppError(message, 403, true, details),
  
  // Validation errors
  validation: (message = 'Validation failed', details = null) => 
    new AppError(message, 400, true, details),
  
  notFound: (message = 'Resource not found', details = null) => 
    new AppError(message, 404, true, details),
  
  conflict: (message = 'Resource conflict', details = null) => 
    new AppError(message, 409, true, details),
  
  // Server errors
  internal: (message = 'Internal server error', details = null) => 
    new AppError(message, 500, true, details),
  
  serviceUnavailable: (message = 'Service unavailable', details = null) => 
    new AppError(message, 503, true, details),
  
  // Rate limiting
  tooManyRequests: (message = 'Too many requests', details = null) => 
    new AppError(message, 429, true, details)
};

/**
 * Centralized error handling middleware
 * Processes all errors and returns consistent responses
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error details (in production, use proper logging service)
  console.error('ERROR:', {
    message: error.message,
    statusCode: error.statusCode || 500,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: req.user?.id || null,
    details: error.details || null
  });
  
  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    const message = 'Invalid ID format';
    error = ErrorFactory.notFound(message, { field: error.path, value: error.value });
  }
  
  // Mongoose duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const message = `${field} already exists`;
    error = ErrorFactory.conflict(message, { field, value: error.keyValue[field] });
  }
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    error = ErrorFactory.validation('Validation failed', errors);
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again';
    error = ErrorFactory.unauthorized(message, { reason: error.message });
  }
  
  if (error.name === 'TokenExpiredError') {
    const message = 'Token expired. Please log in again';
    error = ErrorFactory.unauthorized(message, { expiredAt: error.expiredAt });
  }
  
  // Rate limiting errors
  if (error.code === 'ER_TOO_MANY_CONNECTIONS') {
    error = ErrorFactory.serviceUnavailable('Database connection limit reached');
  }
  
  // Default to internal server error
  if (!error.statusCode) {
    error = ErrorFactory.internal();
  }
  
  // Send response
  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode,
      ...(error.details && { details: error.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Async error catcher - wraps async functions to catch errors automatically
 */
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Not found handler for undefined routes
 */
const notFound = (req, res, next) => {
  const error = ErrorFactory.notFound(`Can't find ${req.originalUrl} on this server`);
  next(error);
};

/**
 * Validation error helper
 */
const handleValidationErrors = (errors) => {
  const formattedErrors = errors.map(err => ({
    field: err.path,
    message: err.message,
    value: err.value
  }));
  
  return ErrorFactory.validation('Validation failed', formattedErrors);
};

/**
 * Database error handler
 */
const handleDatabaseError = (error) => {
  if (error.code === 'SQLITE_CONSTRAINT') {
    if (error.message.includes('UNIQUE')) {
      const field = extractFieldFromError(error.message);
      return ErrorFactory.conflict(`${field} already exists`);
    }
    return ErrorFactory.validation('Database constraint violated');
  }
  
  if (error.code === 'SQLITE_BUSY') {
    return ErrorFactory.serviceUnavailable('Database is busy, please try again');
  }
  
  return ErrorFactory.internal('Database operation failed');
};

/**
 * Extract field name from database error messages
 */
const extractFieldFromError = (errorMessage) => {
  const match = errorMessage.match(/\.(\w+):/);
  return match ? match[1] : 'field';
};

/**
 * Rate limiting error handler
 */
const handleRateLimitError = (error) => {
  const resetTime = error.resetTime ? new Date(error.resetTime) : null;
  const retryAfter = resetTime ? Math.ceil((resetTime - new Date()) / 1000) : null;
  
  return ErrorFactory.tooManyRequests('Too many requests', {
    retryAfter,
    resetTime: resetTime?.toISOString()
  });
};

/**
 * Authentication error handler
 */
const handleAuthError = (error) => {
  if (error.name === 'AuthenticationError') {
    return ErrorFactory.unauthorized(error.message);
  }
  
  if (error.name === 'AuthorizationError') {
    return ErrorFactory.forbidden(error.message);
  }
  
  return ErrorFactory.unauthorized('Authentication failed');
};

/**
 * File upload error handler
 */
const handleUploadError = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return ErrorFactory.validation('File too large');
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return ErrorFactory.validation('Too many files');
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return ErrorFactory.validation('Unexpected file field');
  }
  
  return ErrorFactory.validation('File upload failed');
};

/**
 * Creates a standardized success response
 */
const successResponse = (data, message = 'Success', metadata = null) => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    ...(metadata && { metadata })
  };
};

/**
 * Creates a standardized error response
 */
const errorResponse = (error, details = null) => {
  return {
    success: false,
    error: {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Validation middleware factory
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Validate request body against schema
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
        
        return next(ErrorFactory.validation('Validation failed', validationErrors));
      }
      
      req.body = value; // Use validated/sanitized data
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Authentication middleware factory
 */
const requireAuth = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ErrorFactory.unauthorized('Authentication required'));
    }
    
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(ErrorFactory.forbidden('Insufficient permissions'));
    }
    
    next();
  };
};

/**
 * Rate limiting error mapper
 */
const mapRateLimitError = (error) => {
  if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
    return ErrorFactory.serviceUnavailable('Too many user connections');
  }
  
  if (error.code === 'CONNECTION_LIMIT') {
    return ErrorFactory.serviceUnavailable('Connection limit reached');
  }
  
  return handleRateLimitError(error);
};

module.exports = {
  AppError,
  ErrorFactory,
  errorHandler,
  catchAsync,
  notFound,
  handleValidationErrors,
  handleDatabaseError,
  handleRateLimitError,
  handleAuthError,
  handleUploadError,
  successResponse,
  errorResponse,
  validateRequest,
  requireAuth,
  mapRateLimitError
};