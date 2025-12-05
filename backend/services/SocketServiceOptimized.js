/**
 * Optimized Socket.IO Service with Memory Management
 * 
 * This service provides enhanced Socket.IO functionality with:
 * - Memory leak prevention
 * - Connection management
 * - Typing preview optimization
 * - Heartbeat monitoring
 * - Automatic cleanup
 */

class OptimizedSocketService {
  constructor(io) {
    this.io = io;
    this.connections = new Map(); // Track active connections
    this.typingTimers = new Map(); // Track typing timers
    this.heartbeatInterval = 30000; // 30 seconds
    this.connectionTimeout = 60000; // 60 seconds
    this.maxTypingTextLength = 200; // Maximum typing preview length
    this.typingDebounceDelay = 100; // Debounce delay for typing events
    this.typingClearDelay = 1000; // Clear typing after 1 second of inactivity
    
    this.setupConnectionManagement();
    this.startCleanupInterval();
  }
  
  setupConnectionManagement() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 New socket connection: ${socket.id}`);
      this.handleConnection(socket);
    });
  }
  
  handleConnection(socket) {
    const connectionInfo = {
      id: socket.id,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      rooms: new Set(),
      userId: null,
      siteId: null,
      isAdmin: false,
      heartbeat: null,
      timeout: null
    };
    
    this.connections.set(socket.id, connectionInfo);
    
    // Set up heartbeat
    this.setupHeartbeat(socket, connectionInfo);
    
    // Set up activity tracking
    this.trackActivity(socket, connectionInfo);
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket ${socket.id} disconnected: ${reason}`);
      this.handleDisconnection(socket, reason);
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.cleanupConnection(socket.id);
    });
    
    // Set up connection timeout
    this.setupConnectionTimeout(socket, connectionInfo);
    
    // Set up Socket.IO event handlers
    this.setupEventHandlers(socket, connectionInfo);
  }
  
  setupEventHandlers(socket, connectionInfo) {
    // Join site room
    socket.on('join_site', (data) => {
      this.handleJoinSite(socket, connectionInfo, data);
    });
    
    // Handle typing preview with debouncing
    socket.on('typing_preview', (data) => {
      this.handleTypingPreview(socket, connectionInfo, data);
    });
    
    // Handle typing stop
    socket.on('stop_typing_preview', (data) => {
      this.handleStopTypingPreview(socket, connectionInfo, data);
    });
    
    // Handle regular messages
    socket.on('send_message', (data) => {
      this.handleSendMessage(socket, connectionInfo, data);
    });
    
    // Handle visitor arrival with advanced features
    socket.on('visitor_arrival_advanced', (data) => {
      this.handleVisitorArrivalAdvanced(socket, connectionInfo, data);
    });
    
    // Handle advanced typing preview
    socket.on('typing_preview_advanced', (data) => {
      this.handleTypingPreviewAdvanced(socket, connectionInfo, data);
    });
  }
  
  setupHeartbeat(socket, connectionInfo) {
    const heartbeat = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
        connectionInfo.lastActivity = Date.now();
      } else {
        clearInterval(heartbeat);
        this.cleanupConnection(socket.id);
      }
    }, this.heartbeatInterval);
    
    socket.on('pong', () => {
      connectionInfo.lastActivity = Date.now();
    });
    
    connectionInfo.heartbeat = heartbeat;
  }
  
  setupConnectionTimeout(socket, connectionInfo) {
    const timeout = setTimeout(() => {
      if (Date.now() - connectionInfo.lastActivity > this.connectionTimeout) {
        console.log(`⏰ Disconnecting inactive socket: ${socket.id}`);
        socket.disconnect(true);
        this.cleanupConnection(socket.id);
      }
    }, this.connectionTimeout);
    
    connectionInfo.timeout = timeout;
  }
  
  trackActivity(socket, connectionInfo) {
    // Track all socket activity
    const events = ['message', 'typing', 'join_room', 'leave_room', 'ping', 'pong'];
    
    events.forEach(event => {
      socket.on(event, () => {
        connectionInfo.lastActivity = Date.now();
      });
    });
  }
  
  handleJoinSite(socket, connectionInfo, data) {
    const { siteId } = data;
    if (!siteId) return;
    
    connectionInfo.siteId = siteId;
    connectionInfo.lastActivity = Date.now();
    
    // Leave any existing rooms
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
        connectionInfo.rooms.delete(room);
      }
    });
    
    // Join new room
    const roomName = `site_${siteId}`;
    socket.join(roomName);
    connectionInfo.rooms.add(roomName);
    
    console.log(`🏠 Socket ${socket.id} joined site room: ${roomName}`);
    
    // Notify others in the room
    socket.to(roomName).emit('user_joined', {
      socketId: socket.id,
      timestamp: Date.now()
    });
    
    // Send active sessions to the joining user
    this.sendActiveSessions(socket, siteId);
  }
  
  handleTypingPreview(socket, connectionInfo, data) {
    const { siteId, sessionId, text, isAdmin } = data;
    if (!siteId || !sessionId) return;
    
    connectionInfo.lastActivity = Date.now();
    
    // Debounce typing preview
    const previewKey = `${sessionId}-${isAdmin ? 'admin' : 'visitor'}`;
    const roomName = `site_${siteId}`;
    
    // Clear existing timer
    if (this.typingTimers.has(previewKey)) {
      clearTimeout(this.typingTimers.get(previewKey));
    }
    
    // Validate and sanitize text
    const sanitizedText = this.sanitizeTypingText(text);
    
    // Store typing preview
    const previewData = {
      sessionId,
      text: sanitizedText,
      isAdmin,
      timestamp: Date.now(),
      socketId: socket.id
    };
    
    // Broadcast to room (excluding sender)
    const targetEvent = isAdmin ? 'visitor_typing_preview' : 'admin_typing_preview';
    socket.to(roomName).emit(targetEvent, previewData);
    
    // Schedule auto-clear
    const timer = setTimeout(() => {
      this.clearTypingPreview(previewKey, siteId, sessionId, isAdmin);
    }, 1000); // Clear after 1 second of inactivity
    
    this.typingTimers.set(previewKey, timer);
  }
  
  handleStopTypingPreview(socket, connectionInfo, data) {
    const { siteId, sessionId, isAdmin } = data;
    const previewKey = `${sessionId}-${isAdmin ? 'admin' : 'visitor'}`;
    
    this.clearTypingPreview(previewKey, siteId, sessionId, isAdmin);
  }
  
  handleSendMessage(socket, connectionInfo, data) {
    const { siteId, sessionId, text, senderType } = data;
    if (!siteId || !sessionId || !text) return;
    
    connectionInfo.lastActivity = Date.now();
    
    const roomName = `site_${siteId}`;
    const messageData = {
      siteId,
      sessionId,
      text: this.sanitizeMessage(text),
      sender: {
        type: senderType,
        id: connectionInfo.userId || socket.id,
        name: senderType === 'admin' ? 'Admin' : 'Visitor'
      },
      timestamp: Date.now()
    };
    
    // Broadcast to room
    socket.to(roomName).emit('new_message', messageData);
    
    console.log(`💬 Message sent in room ${roomName} from ${senderType}`);
  }
  
  handleVisitorArrivalAdvanced(socket, connectionInfo, data) {
    const { siteId, visitorId, location, fingerprint } = data;
    if (!siteId || !visitorId) return;
    
    connectionInfo.lastActivity = Date.now();
    connectionInfo.siteId = siteId;
    
    const roomName = `site_${siteId}`;
    const arrivalData = {
      visitorId,
      location: location || null,
      fingerprint: fingerprint || null,
      timestamp: Date.now(),
      socketId: socket.id
    };
    
    // Broadcast to admin users in the room
    socket.to(roomName).emit('visitor_arrival_advanced', arrivalData);
    
    console.log(`👤 Advanced visitor arrival in room ${roomName}: ${visitorId}`);
  }
  
  handleTypingPreviewAdvanced(socket, connectionInfo, data) {
    const { siteId, sessionId, text, isAdmin, confidence } = data;
    if (!siteId || !sessionId) return;
    
    connectionInfo.lastActivity = Date.now();
    
    const previewKey = `${sessionId}-${isAdmin ? 'admin' : 'visitor'}`;
    const roomName = `site_${siteId}`;
    
    // Validate confidence score
    const validConfidence = Math.max(0, Math.min(1, confidence || 0.5));
    
    // Sanitize and limit text length
    const sanitizedText = this.sanitizeTypingText(text);
    
    const previewData = {
      sessionId,
      text: sanitizedText,
      isAdmin,
      confidence: validConfidence,
      timestamp: Date.now(),
      socketId: socket.id
    };
    
    // Broadcast to room (excluding sender)
    const targetEvent = isAdmin ? 'visitor_typing_preview' : 'admin_typing_preview';
    socket.to(roomName).emit(targetEvent, previewData);
    
    console.log(`👁️ Advanced typing preview in room ${roomName}: ${sanitizedText.substring(0, 20)}...`);
    
    // Schedule auto-clear
    const timer = setTimeout(() => {
      this.clearTypingPreview(previewKey, siteId, sessionId, isAdmin);
    }, this.typingClearDelay);
    
    this.typingTimers.set(previewKey, timer);
  }
  
  clearTypingPreview(previewKey, siteId, sessionId, isAdmin) {
    // Remove from storage
    this.typingTimers.delete(previewKey);
    
    // Clear timer
    if (this.typingTimers.has(previewKey)) {
      clearTimeout(this.typingTimers.get(previewKey));
      this.typingTimers.delete(previewKey);
    }
    
    // Notify clients to clear preview
    const targetEvent = isAdmin ? 'visitor_typing_cleared' : 'admin_typing_cleared';
    const roomName = `site_${siteId}`;
    
    this.io.to(roomName).emit(targetEvent, {
      sessionId,
      isAdmin,
      clearedAt: Date.now()
    });
  }
  
  sendActiveSessions(socket, siteId) {
    const roomName = `site_${siteId}`;
    const activeSessions = [];
    
    // Get all sockets in the room
    const room = this.io.sockets.adapter.rooms.get(roomName);
    if (room) {
      room.forEach(socketId => {
        const connection = this.connections.get(socketId);
        if (connection && connection.siteId === siteId) {
          activeSessions.push({
            socketId,
            connectedAt: connection.connectedAt,
            isAdmin: connection.isAdmin
          });
        }
      });
    }
    
    socket.emit('active_sessions', activeSessions);
  }
  
  handleDisconnection(socket, reason) {
    console.log(`🔌 Socket ${socket.id} disconnected: ${reason}`);
    this.cleanupConnection(socket.id);
  }
  
  cleanupConnection(socketId) {
    const connection = this.connections.get(socketId);
    if (connection) {
      console.log(`🧹 Cleaning up connection: ${socketId}`);
      
      // Clear timers
      if (connection.heartbeat) {
        clearInterval(connection.heartbeat);
      }
      if (connection.timeout) {
        clearTimeout(connection.timeout);
      }
      
      // Clear typing timers for this connection
      this.clearConnectionTypingTimers(socketId);
      
      // Leave all rooms and notify others
      connection.rooms.forEach(room => {
        this.io.to(room).emit('user_left', { 
          socketId,
          timestamp: Date.now()
        });
      });
      
      // Remove from tracking
      this.connections.delete(socketId);
      
      console.log(`✅ Connection cleaned up: ${socketId}`);
    }
  }
  
  clearConnectionTypingTimers(socketId) {
    // Clear any typing timers associated with this socket
    const typingKeys = Array.from(this.typingTimers.keys()).filter(key => 
      key.includes(socketId)
    );
    
    typingKeys.forEach(key => {
      const timer = this.typingTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.typingTimers.delete(key);
      }
    });
  }
  
  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      const staleConnections = [];
      
      for (const [socketId, connection] of this.connections) {
        if (now - connection.lastActivity > this.connectionTimeout * 2) {
          staleConnections.push(socketId);
        }
      }
      
      staleConnections.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
        this.cleanupConnection(socketId);
      });
      
      if (staleConnections.length > 0) {
        console.log(`🧹 Cleaned up ${staleConnections.length} stale connections`);
      }
    }, 60000); // Run every minute
  }
  
  // Utility functions
  sanitizeTypingText(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Limit length
    const limitedText = text.substring(0, this.maxTypingTextLength);
    
    // Basic sanitization (remove potential XSS)
    return limitedText.replace(/[<>]/g, '');
  }
  
  sanitizeMessage(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Basic sanitization
    return text.trim();
  }
  
  // Get connection statistics
  getConnectionStats() {
    const now = Date.now();
    const activeConnections = Array.from(this.connections.values()).filter(conn => 
      now - conn.lastActivity < 30000
    ).length;
    
    return {
      totalConnections: this.connections.size,
      activeConnections,
      typingSessions: this.typingTimers.size,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
  
  // Get detailed connection info
  getConnectionInfo(socketId) {
    return this.connections.get(socketId) || null;
  }
  
  // Broadcast to all connections in a site
  broadcastToSite(siteId, event, data) {
    const roomName = `site_${siteId}`;
    this.io.to(roomName).emit(event, data);
  }
  
  // Broadcast to admin users only
  broadcastToAdmins(siteId, event, data) {
    const roomName = `site_${siteId}`;
    const sockets = this.io.sockets.adapter.rooms.get(roomName);
    
    if (sockets) {
      sockets.forEach(socketId => {
        const connection = this.connections.get(socketId);
        if (connection && connection.isAdmin) {
          this.io.to(socketId).emit(event, data);
        }
      });
    }
  }
}

module.exports = OptimizedSocketService;