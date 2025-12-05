/**
 * Rate limiting middleware for API protection
 * Implements different rate limits for various endpoint types
 */

const rateLimit = require('express-rate-limit');

// Simple in-memory store for development (replace with Redis in production)
const store = new Map();

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  // Simple in-memory store (use Redis in production)
  store: {
    incr: async (key) => {
      const current = store.get(key) || 0;
      store.set(key, current + 1);
      return { totalHits: current + 1, resetTime: new Date(Date.now() + 15 * 60 * 1000) };
    },
    decrement: async (key) => {
      const current = store.get(key) || 0;
      store.set(key, Math.max(0, current - 1));
    },
    resetKey: async (key) => {
      store.delete(key);
    },
    resetAll: async () => {
      store.clear();
    }
  },
  
  // Skip certain endpoints
  skip: (req) => {
    return req.path === '/health' || 
           req.path === '/demo.html' || 
           req.path === '/widget.js' ||
           req.path.startsWith('/api/widget/status');
  },
  
  // Custom key generator (include IP + user agent for better identification)
  keyGenerator: (req) => {
    return req.ip + ':' + (req.get('User-Agent') || 'unknown');
  }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  
  store: {
    incr: async (key) => {
      const current = store.get(key) || 0;
      store.set(key, current + 1);
      return { totalHits: current + 1, resetTime: new Date(Date.now() + 15 * 60 * 1000) };
    },
    decrement: async (key) => {
      const current = store.get(key) || 0;
      store.set(key, Math.max(0, current - 1));
    },
    resetKey: async (key) => {
      store.delete(key);
    },
    resetAll: async () => {
      store.clear();
    }
  },
  
  keyGenerator: (req) => {
    return 'auth:' + req.ip + ':' + (req.body.email || 'unknown');
  }
});

// Upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 uploads per minute
  message: {
    success: false,
    error: 'Too many uploads, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  store: {
    incr: async (key) => {
      const current = store.get(key) || 0;
      store.set(key, current + 1);
      return { totalHits: current + 1, resetTime: new Date(Date.now() + 60 * 1000) };
    },
    decrement: async (key) => {
      const current = store.get(key) || 0;
      store.set(key, Math.max(0, current - 1));
    },
    resetKey: async (key) => {
      store.delete(key);
    },
    resetAll: async () => {
      store.clear();
    }
  },
  
  keyGenerator: (req) => {
    return 'upload:' + req.ip;
  }
});

// Dashboard rate limiting (more restrictive for admin operations)
const dashboardLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 dashboard requests per 5 minutes
  message: {
    success: false,
    error: 'Too many dashboard requests, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  store: {
    incr: async (key) => {
      const current = store.get(key) || 0;
      store.set(key, current + 1);
      return { totalHits: current + 1, resetTime: new Date(Date.now() + 5 * 60 * 1000) };
    },
    decrement: async (key) => {
      const current = store.get(key) || 0;
      store.set(key, Math.max(0, current - 1));
    },
    resetKey: async (key) => {
      store.delete(key);
    },
    resetAll: async () => {
      store.clear();
    }
  },
  
  keyGenerator: (req) => {
    return 'dashboard:' + req.ip;
  }
});

// Export rate limiters
module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  dashboardLimiter
};

/**
 * Custom rate limiting middleware for specific endpoints
 */
function createRateLimiter(options) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests',
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    
    store: {
      incr: async (key) => {
        const current = store.get(key) || 0;
        store.set(key, current + 1);
        return { totalHits: current + 1, resetTime: new Date(Date.now() + windowMs) };
      },
      decrement: async (key) => {
        const current = store.get(key) || 0;
        store.set(key, Math.max(0, current - 1));
      },
      resetKey: async (key) => {
        store.delete(key);
      },
      resetAll: async () => {
        store.clear();
      }
    },
    
    keyGenerator
  });
}

module.exports.createRateLimiter = createRateLimiter;