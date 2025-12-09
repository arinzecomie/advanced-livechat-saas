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
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Import database connections based on what's available
let db;
let dbType = 'unknown';

try {
  // Try PostgreSQL first if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    console.log('🐘 Attempting PostgreSQL connection...');
    db = await import('./config/db-postgresql-fixed.js');
    dbType = 'postgresql';
    console.log('✅ PostgreSQL database loaded');
  } else {
    // Fall back to SQLite
    console.log('💾 Attempting SQLite connection...');
    db = await import('./config/db-sqlite.js');
    dbType = 'sqlite';
    console.log('✅ SQLite database loaded');
  }
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  console.log('💾 Falling back to SQLite...');
  try {
    db = await import('./config/db-sqlite.js');
    dbType = 'sqlite';
    console.log('✅ SQLite fallback loaded');
  } catch (fallbackError) {
    console.error('❌ SQLite fallback also failed:', fallbackError.message);
    process.exit(1);
  }
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