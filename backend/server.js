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

// Middleware
app.use(cors());

// Enhanced JSON parsing with error handling
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for debugging
    req.rawBody = buf.toString();
  }
}));

// JSON error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ JSON Parse Error:', {
      message: err.message,
      body: req.rawBody,
      path: req.path,
      method: req.method,
      headers: req.headers
    });
    return res.status(400).json({ 
      error: 'Invalid JSON format',
      message: 'Please check your request body format'
    });
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  // Log important request info
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('📋 Content-Type:', req.headers['content-type']);
    console.log('📏 Content-Length:', req.headers['content-length']);
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

// Serve frontend dashboard
app.use('/dashboard', express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all handler for React Router
app.get('/dashboard/*', (req, res) => {
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