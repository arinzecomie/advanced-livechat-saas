/**
 * Socket.IO Service - handles real-time chat messaging
 * Manages chat rooms and message broadcasting
 */
import MessageModel from '../models/MessageModel.js';

export default class SocketService {
  constructor(io) {
    this.io = io;
    this.messageModel = new MessageModel();
    this.activeSessions = new Map(); // Track active chat sessions
  }

  // Initialize Socket.IO event handlers
  initialize() {
    this.io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id);

      // Join site room
      socket.on('join_site', async (data) => {
        const { siteId, sessionId, userType = 'visitor' } = data;
        const room = `site_${siteId}`;
        
        socket.join(room);
        socket.siteId = siteId;
        socket.sessionId = sessionId;
        socket.userType = userType;
        
        console.log(`👥 ${userType} joined room: ${room}`);
        
        // Track active session
        if (!this.activeSessions.has(sessionId)) {
          this.activeSessions.set(sessionId, {
            siteId,
            socketId: socket.id,
            userType,
            joinedAt: new Date()
          });
        }

        // Send recent messages to new participant
        const recentMessages = await this.messageModel.getSessionMessages(siteId, sessionId, 20);
        socket.emit('chat_history', recentMessages);

        // Notify others in room
        socket.to(room).emit('user_joined', {
          sessionId,
          userType,
          timestamp: new Date()
        });
      });

      // Handle incoming messages
      socket.on('send_message', async (data) => {
        const { text, sessionId } = data;
        const siteId = socket.siteId;
        
        if (!siteId || !sessionId) {
          socket.emit('error', { message: 'Not joined to any site' });
          return;
        }

        const message = {
          siteId,
          sessionId,
          sender: socket.userType || 'visitor',
          text: text.trim(),
          timestamp: new Date()
        };

        try {
          // Save message to database
          const savedMessage = await this.messageModel.create(message);
          
          // Broadcast to room
          const room = `site_${siteId}`;
          this.io.to(room).emit('new_message', savedMessage);
          
          console.log(`💬 Message in ${room} from ${socket.userType}: ${text}`);
        } catch (error) {
          console.error('❌ Error saving message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
        const { siteId, sessionId, isTyping } = data;
        const room = `site_${siteId}`;
        
        socket.to(room).emit('user_typing', {
          sessionId,
          userType: socket.userType,
          isTyping
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
        
        // Clean up active session
        if (socket.sessionId) {
          this.activeSessions.delete(socket.sessionId);
          
          // Notify others in room
          const room = `site_${socket.siteId}`;
          socket.to(room).emit('user_left', {
            sessionId: socket.sessionId,
            userType: socket.userType,
            timestamp: new Date()
          });
        }
      });

      // Handle admin join
      socket.on('admin_join', async (data) => {
        const { siteId } = data;
        const room = `site_${siteId}`;
        
        socket.join(room);
        socket.siteId = siteId;
        socket.userType = 'admin';
        
        console.log(`👨‍💼 Admin joined room: ${room}`);
        
        // Get active sessions for this site
        const activeSessions = Array.from(this.activeSessions.entries())
          .filter(([_, session]) => session.siteId === siteId)
          .map(([sessionId, session]) => ({
            sessionId,
            userType: session.userType,
            joinedAt: session.joinedAt
          }));
        
        socket.emit('active_sessions', activeSessions);
      });

      // Handle session close (admin action)
      socket.on('close_session', async (data) => {
        const { sessionId } = data;
        
        if (socket.userType !== 'admin') {
          socket.emit('error', { message: 'Only admins can close sessions' });
          return;
        }

        const session = this.activeSessions.get(sessionId);
        if (session) {
          // Find socket and disconnect
          const targetSocket = this.io.sockets.sockets.get(session.socketId);
          if (targetSocket) {
            targetSocket.emit('session_closed', { reason: 'Admin closed session' });
            targetSocket.disconnect();
          }
          
          this.activeSessions.delete(sessionId);
          
          // Notify room
          const room = `site_${session.siteId}`;
          socket.to(room).emit('session_closed', { sessionId });
        }
      });
    });
  }

  // Get active sessions for a site
  getActiveSessions(siteId) {
    return Array.from(this.activeSessions.entries())
      .filter(([_, session]) => session.siteId === siteId)
      .map(([sessionId, session]) => ({
        sessionId,
        userType: session.userType,
        joinedAt: session.joinedAt
      }));
  }

  // Broadcast to specific session
  broadcastToSession(siteId, sessionId, event, data) {
    const room = `site_${siteId}`;
    this.io.to(room).emit(event, {
      ...data,
      targetSessionId: sessionId
    });
  }

  // Get room stats
  getRoomStats(siteId) {
    const room = `site_${siteId}`;
    const sockets = this.io.sockets.adapter.rooms.get(room);
    
    return {
      room,
      connectedUsers: sockets ? sockets.size : 0,
      activeSessions: this.getActiveSessions(siteId).length
    };
  }
}