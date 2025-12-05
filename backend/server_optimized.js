/**
 * Optimized Advanced Live Chat SaaS Server
 * 
 * This is an enhanced version of the server with:
 * - Performance optimizations
 * - Security improvements
 * - Better error handling
 * - Memory management
 * - Configuration management
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import optimized services and middleware
const { config, validateConfig } = require('./config/app');
const { errorHandler, notFound, catchAsync } = require('./utils/ErrorHandler');
const { generalLimiter, authLimiter, uploadLimiter } = require('./middlewares/rateLimiter');
const OptimizedSocketService = require('./services/SocketServiceOptimized');

// Import routes
const authRoutes = require('./routes/auth');
const widgetRoutes = require('./routes/widget');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');

// Import database
const db = require('./config/db');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Validate configuration
validateConfig();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
const corsOptions = {
  origin: config.server.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression({
  threshold: 1024, // Compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Logging middleware
if (config.logging.enableConsole) {
  app.use(morgan(config.logging.format, {
    skip: (req) => req.path === '/health' // Skip health checks
  }));
}

// Body parsing middleware
app.use(express.json({ limit: config.upload.maxSize }));
app.use(express.urlencoded({ extended: true, limit: config.upload.maxSize }));

// Rate limiting
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/chat/upload', uploadLimiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint (excluded from rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Socket.IO setup
const io = socketIo(server, {
  cors: config.socket.cors,
  transports: config.socket.transports,
  pingTimeout: config.socket.pingTimeout,
  pingInterval: config.socket.pingInterval,
  maxHttpBufferSize: config.socket.maxHttpBufferSize
});

// Initialize optimized socket service
const socketService = new OptimizedSocketService(io);

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connections
    if (db.client) {
      db.client.destroy(() => {
        console.log('Database connections closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Start server
const PORT = config.server.port;

server.listen(PORT, async () => {
  try {
    console.log(`\n🚀 Advanced Live Chat SaaS - Optimized Server`);
    console.log('=' .repeat(60));
    console.log(`🌐 Server running on port: ${PORT}`);
    console.log(`📊 Environment: ${config.server.nodeEnv}`);
    console.log(`🔄 CORS Origins: ${config.server.corsOrigins.join(', ')}`);
    console.log('=' .repeat(60));
    
    // Test database connection
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');
    
    // Get socket service stats
    const stats = socketService.getConnectionStats();
    console.log('📊 Socket Service Ready');
    console.log(`   Total Connections: ${stats.totalConnections}`);
    console.log(`   Memory Usage: ${(stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n✅ Server started successfully!');
    console.log('🧪 Run tests to verify functionality: node test_simple.js');
    console.log('📚 Implementation guides available in project root');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
});

// Export for testing
module.exports = { app, server, io, socketService };