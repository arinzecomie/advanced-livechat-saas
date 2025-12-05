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

// Import database connections
import './config/db.js';
import './config/mongo.js';

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

// Initialize Socket.IO service
const socketService = new SocketService(io);
socketService.initialize();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Advanced Live Chat SaaS server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🎯 Demo page: http://localhost:${PORT}/demo.html`);
});