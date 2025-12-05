/**
 * Global Error Handler - catches and formats all errors
 * Provides consistent error responses across the API
 */
export default function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  // Default error
  let status = 500;
  let message = 'Internal server error';
  let error = 'server_error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
    error = 'validation_error';
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
    error = 'unauthorized';
  } else if (err.message === 'User already exists') {
    status = 409;
    message = 'User already exists';
    error = 'user_exists';
  } else if (err.message === 'Invalid credentials') {
    status = 401;
    message = 'Invalid email or password';
    error = 'invalid_credentials';
  } else if (err.message === 'Site not found') {
    status = 404;
    message = 'Site not found';
    error = 'site_not_found';
  } else if (err.message === 'Invalid token') {
    status = 401;
    message = 'Invalid or expired token';
    error = 'invalid_token';
  } else if (err.code === 'SQLITE_CONSTRAINT') {
    status = 409;
    message = 'Database constraint violation';
    error = 'constraint_error';
  }

  // Development environment - include stack trace
  if (process.env.NODE_ENV === 'development') {
    return res.status(status).json({
      error,
      message,
      stack: err.stack,
      details: err.message
    });
  }

  // Production environment - sanitized error
  res.status(status).json({
    error,
    message: status === 500 ? 'Something went wrong' : message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
}