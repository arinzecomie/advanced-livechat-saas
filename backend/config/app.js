/**
 * Centralized Application Configuration
 * 
 * This module provides a centralized configuration management system
 * with validation and environment variable integration.
 */

const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigins: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
      ['http://localhost:3000', 'https://talkavax-production.up.railway.app/']
  },
  
  // Database Configuration
  database: {
    sqlite: {
      filename: process.env.DATABASE_FILENAME || './dev.sqlite3',
      pool: {
        min: 2,
        max: 10
      }
    },
    mongodb: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/advanced-livechat',
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: 'majority'
      }
    }
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-characters',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    algorithm: 'HS256',
    issuer: 'advanced-livechat-saas',
    audience: 'dashboard'
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 5,
    uploadMaxRequests: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX) || 10,
    dashboardMaxRequests: parseInt(process.env.RATE_LIMIT_DASHBOARD_MAX) || 50
  },
  
  // File Upload Configuration
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFiles: parseInt(process.env.MAX_FILES_PER_REQUEST) || 1,
    maxDimensions: {
      width: 4096,
      height: 4096
    }
  },
  
  // External Services Configuration
  services: {
    cloudinary: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
      folder: 'chat-uploads'
    },
    
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    }
  },
  
  // Socket.IO Configuration
  socket: {
    cors: {
      origin: function (origin, callback) {
        const allowedOrigins = config.server.corsOrigins;
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-CSRF-Token'
      ]
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6, // 1MB
    
    // Connection management
    connectionTimeout: 60000, // 60 seconds
    heartbeatInterval: 30000, // 30 seconds
    maxTypingTextLength: 200,
    typingDebounceDelay: 100,
    typingClearDelay: 1000
  },
  
  // Security Configuration
  security: {
    bcryptRounds: 12,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    maxFailedAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    
    cors: {
      maxAge: 86400, // 24 hours
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
    enableConsole: process.env.NODE_ENV !== 'test',
    enableFile: process.env.NODE_ENV === 'production',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    maxFiles: 10,
    maxSize: '10m'
  }
};

/**
 * Validates required environment variables
 */
function validateConfig() {
  const required = [
    'JWT_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing required environment variables:', missing.join(', '));
    console.warn('Using default values - not recommended for production');
  }
  
  // Validate JWT secret length
  if (config.jwt.secret && config.jwt.secret.length < 32) {
    console.warn('⚠️ JWT_SECRET should be at least 32 characters for security');
  }
  
  // Validate Cloudinary configuration if any is provided
  const hasCloudinaryConfig = config.services.cloudinary.cloud_name || 
                             config.services.cloudinary.api_key || 
                             config.services.cloudinary.api_secret;
  
  if (hasCloudinaryConfig && (!config.services.cloudinary.cloud_name || 
                             !config.services.cloudinary.api_key || 
                             !config.services.cloudinary.api_secret)) {
    console.warn('⚠️ Incomplete Cloudinary configuration provided');
  }
}

/**
 * Gets configuration for a specific module
 */
function getModuleConfig(moduleName) {
  const moduleConfig = config[moduleName];
  if (!moduleConfig) {
    throw new Error(`Configuration module '${moduleName}' not found`);
  }
  return moduleConfig;
}

/**
 * Updates configuration dynamically (useful for testing)
 */
function updateConfig(updates) {
  Object.assign(config, updates);
}

// Validate configuration on load
validateConfig();

module.exports = {
  config,
  validateConfig,
  getModuleConfig,
  updateConfig
};