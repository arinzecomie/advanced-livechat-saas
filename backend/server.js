/**
 * Main server entry point
 * Express + Socket.IO server for Advanced Live Chat SaaS
 * Handles API routes, static files, and real-time chat
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import widgetRoutes from './routes/widget.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import superAdminRoutes from './routes/superAdminRoutes.js';

// Import services
import SocketService from './services/SocketService.js';

// Import middlewares
import errorHandler from './middlewares/errorHandler.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware - Enhanced CORS configuration
app.use(cors({
  origin: [
    'https://talkavax-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Additional CORS headers for better browser compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    return res.sendStatus(200);
  }
  
  next();
});

// Enhanced JSON parsing with error handling - browser-friendly
app.use(express.json({
  limit: '10mb',
  strict: false, // Allow non-strict JSON parsing
  type: ['application/json', 'text/plain'] // Accept both JSON and plain text
}));

// Raw body parser for debugging
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = data;
      console.log('📋 Raw request body:', data);
      console.log('📊 Content-Type:', req.headers['content-type']);
      console.log('📏 Content-Length:', req.headers['content-length']);
      console.log('🌐 Origin:', req.headers.origin);
      
      // Try to parse JSON manually if express.json failed
      if (req.headers['content-type']?.includes('application/json') && data) {
        try {
          req.body = JSON.parse(data);
          console.log('✅ Manual JSON parsing successful');
        } catch (e) {
          console.log('❌ Manual JSON parsing failed:', e.message);
        }
      }
    });
  }
  next();
});

// JSON error handler - enhanced debugging
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ JSON Parse Error Details:', {
      error: err.message,
      rawBody: req.rawBody,
      bodyLength: req.rawBody?.length,
      contentType: req.headers['content-type'],
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(400).json({ 
      error: 'Invalid JSON format',
      message: 'Please check your request body format',
      debug: {
        receivedBody: req.rawBody,
        contentType: req.headers['content-type'],
        errorDetails: err.message
      }
    });
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Enhanced request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`  Headers: ${JSON.stringify(req.headers, null, 2).substring(0, 200)}...`);
  
  // Log important request info
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('📋 Content-Type:', req.headers['content-type']);
    console.log('📏 Content-Length:', req.headers['content-length']);
  }
  
  // Log dashboard-related requests specifically
  if (req.path.includes('/dashboard')) {
    console.log('📊 DASHBOARD REQUEST:', req.method, req.path);
    console.log('📊 User-Agent:', req.headers['user-agent']);
    console.log('📊 Accept:', req.headers['accept']);
  }
  
  next();
});

// Import database initializer and provider
import { initializeDatabase } from './config/db-initializer.js';
import { initializeDatabase as initDatabaseProvider } from './config/database-provider.js';

// Initialize database
let db;
let dbType = 'unknown';

try {
  // First initialize the database provider for models
  const providerResult = await initDatabaseProvider();
  db = providerResult.db;
  dbType = providerResult.dbType;
  
  console.log(`✅ Database provider initialized with ${dbType}`);
} catch (error) {
  console.error('❌ Database initialization failed:', error.message);
  process.exit(1);
}

// Import MongoDB
import './config/mongo.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: dbType,
    mongodb: process.env.MONGO_URI ? 'configured' : 'not configured'
  });
});

// Demo page
app.get('/demo.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo.html'));
});

// Widget JavaScript file
app.get('/widget.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'widget.js'));
});

// Test route to verify file serving works
app.get('/test-file', (req, res) => {
  console.log('🧪 Testing file serving');
  const testPath = path.join(__dirname, '../frontend/dist', 'index.html');
  console.log('🧪 Test file path:', testPath);
  
  // Check if file exists
  const fs = require('fs');
  if (fs.existsSync(testPath)) {
    console.log('✅ File exists, sending it');
    res.sendFile(testPath);
  } else {
    console.log('❌ File does not exist:', testPath);
    res.status(404).send('File not found: ' + testPath);
  }
});

// Dashboard routes - serve React app for all dashboard paths
// Fixed: remove redirect to prevent infinite loop

// Handle dashboard root - serve React app directly (NO REDIRECT)
app.get('/dashboard', (req, res) => {
  console.log('📊 Serving dashboard index for /dashboard');
  const indexPath = path.join(__dirname, '../frontend/dist', 'index.html');
  console.log('📊 Sending file:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Error sending dashboard index:', err);
      res.status(500).send('Dashboard not available');
    } else {
      console.log('✅ Dashboard index sent successfully');
    }
  });
});

// Handle dashboard with trailing slash - serve the React app
app.get('/dashboard/', (req, res) => {
  console.log('📊 Serving dashboard index for /dashboard/');
  const indexPath = path.join(__dirname, '../frontend/dist', 'index.html');
  console.log('📊 Sending file:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Error sending dashboard index:', err);
      res.status(500).send('Dashboard not available');
    } else {
      console.log('✅ Dashboard index sent successfully');
    }
  });
});

// Handle all nested dashboard routes
app.get('/dashboard/*', (req, res) => {
  console.log('📊 Serving dashboard index for /dashboard/* - Path:', req.path);
  const indexPath = path.join(__dirname, '../frontend/dist', 'index.html');
  console.log('📊 Sending file:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Error sending dashboard index for nested route:', err);
      res.status(500).send('Dashboard not available');
    } else {
      console.log('✅ Dashboard index sent successfully for nested route');
    }
  });
});

// Serve static files for dashboard assets (JS, CSS, etc.)
app.use('/dashboard', express.static(path.join(__dirname, '../frontend/dist'), {
  index: false // Don't serve index.html automatically
}));

// Serve frontend landing page at root
app.use('/', express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all handler for React Router - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// Initialize Socket.IO service
const socketService = new SocketService(io);
socketService.initialize();

// Error handling middleware
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Advanced Live Chat SaaS server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🎯 Demo page: http://localhost:${PORT}/demo.html`);
});

export { io };