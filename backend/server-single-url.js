/**
 * Single URL Server Configuration
 * Express + Socket.IO server that serves both backend API and frontend static files
 * This allows the entire application to run on a single domain/port
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

// Import database connections
import './config/db.js';
import './config/mongo.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Enhanced CORS configuration for single URL deployment
const corsOptions = {
  origin: process.env.CORS_ORIGIN || true, // Allow same origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory (existing widget files)
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Socket.IO service
const socketService = new SocketService(io);
socketService.initialize();

// API Routes - These must come BEFORE the catch-all route
app.use('/api/auth', authRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

// Serve frontend static files from frontend/dist
const frontendPath = path.join(__dirname, '../frontend/dist');

// Check if frontend is built
if (fs.existsSync(frontendPath)) {
  console.log('📁 Serving frontend static files from:', frontendPath);
  
  // Serve static files
  app.use(express.static(frontendPath));
  
  // Handle React Router - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    // Don't serve index.html for API routes, socket.io, or static files
    if (
      req.path.startsWith('/api') || 
      req.path.startsWith('/socket.io') || 
      req.path.includes('.') || // Files with extensions
      req.path === '/health' ||
      req.path === '/demo.html' ||
      req.path === '/widget.js'
    ) {
      return next();
    }
    
    // Serve index.html for React Router routes
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ 
        error: 'Frontend not found', 
        message: 'Please build the frontend first: npm run build:frontend' 
      });
    }
  });
} else {
  console.log('⚠️  Frontend not built yet. Run: npm run build:frontend');
  
  // Serve a simple message if frontend is not built
  app.get('/', (req, res) => {
    res.json({
      message: 'Advanced Live Chat SaaS Backend is Running',
      status: 'Backend operational, frontend not built yet',
      instructions: 'Run "npm run build:frontend" to build and serve the frontend',
      endpoints: {
        health: '/health',
        demo: '/demo.html',
        widget: '/widget.js',
        api: '/api'
      }
    });
  });
}

// Error handling middleware
app.use(errorHandler);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: [
      '/api/auth/*',
      '/api/widget/*',
      '/api/dashboard/*',
      '/api/admin/*',
      '/api/super-admin/*'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    error: {
      message: NODE_ENV === 'production' ? 'Internal server error' : message,
      status: status,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Advanced Live Chat SaaS - Single URL Deployment`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Main URL: http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🎯 Demo page: http://localhost:${PORT}/demo.html`);
  console.log(`🔌 API Base: http://localhost:${PORT}/api`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
  
  if (NODE_ENV === 'production') {
    console.log(`📈 Production mode enabled`);
  } else {
    console.log(`🔧 Development mode enabled`);
  }
});