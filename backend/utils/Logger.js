/**
 * Simple Logger Utility
 * Basic logging functionality for the application
 */
class Logger {
  constructor(service = 'general') {
    this.service = service;
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.service,
      message,
      ...(data && { data })
    };

    console.log(JSON.stringify(logEntry));
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  debug(message, data) {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, data);
    }
  }
}

export default Logger;