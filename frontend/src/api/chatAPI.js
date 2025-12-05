/**
 * Chat API - handles real-time chat operations
 * Socket.IO integration for live messaging
 */
import { io } from 'socket.io-client'

class ChatService {
  constructor() {
    this.socket = null
    this.connected = false
    this.siteId = null
    this.sessionId = null
    this.messageHandlers = new Set()
    this.connectionHandlers = new Set()
  }

  // Connect to chat server
  connect(serverUrl, siteId, sessionId, userType = 'admin') {
    if (this.socket) {
      this.disconnect()
    }

    this.siteId = siteId
    this.sessionId = sessionId

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    })

    this.socket.on('connect', () => {
      console.log('🔌 Connected to chat server')
      this.connected = true
      this.notifyConnectionHandlers(true)

      // Join site room
      this.socket.emit('join_site', {
        siteId: this.siteId,
        sessionId: this.sessionId,
        userType: userType
      })
    })

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from chat server')
      this.connected = false
      this.notifyConnectionHandlers(false)
    })

    this.socket.on('new_message', (message) => {
      this.notifyMessageHandlers('new_message', message)
    })

    this.socket.on('chat_history', (messages) => {
      this.notifyMessageHandlers('chat_history', messages)
    })

    this.socket.on('user_joined', (data) => {
      this.notifyMessageHandlers('user_joined', data)
    })

    this.socket.on('user_left', (data) => {
      this.notifyMessageHandlers('user_left', data)
    })

    this.socket.on('user_typing', (data) => {
      this.notifyMessageHandlers('user_typing', data)
    })

    this.socket.on('active_sessions', (sessions) => {
      this.notifyMessageHandlers('active_sessions', sessions)
    })

    this.socket.on('session_closed', (data) => {
      this.notifyMessageHandlers('session_closed', data)
    })

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error)
      this.notifyMessageHandlers('error', error)
    })
  }

  // Disconnect from chat server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
      this.notifyConnectionHandlers(false)
    }
  }

  // Send message
  sendMessage(text, targetSessionId = null) {
    if (!this.socket || !this.connected) {
      console.error('❌ Not connected to chat server')
      return false
    }

    const messageData = {
      text: text.trim(),
      sessionId: targetSessionId || this.sessionId
    }

    this.socket.emit('send_message', messageData)
    return true
  }

  // Send typing indicator
  sendTyping(isTyping, targetSessionId = null) {
    if (!this.socket || !this.connected) return

    this.socket.emit('typing', {
      siteId: this.siteId,
      sessionId: targetSessionId || this.sessionId,
      isTyping: isTyping
    })
  }

  // Close session (admin only)
  closeSession(sessionId) {
    if (!this.socket || !this.connected) return false

    this.socket.emit('close_session', { sessionId })
    return true
  }

  // Admin join specific site
  adminJoin(siteId) {
    if (!this.socket || !this.connected) return false

    this.socket.emit('admin_join', { siteId })
    return true
  }

  // Add message handler
  onMessage(handler) {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  // Add connection handler
  onConnection(handler) {
    this.connectionHandlers.add(handler)
    return () => this.connectionHandlers.delete(handler)
  }

  // Notify message handlers
  notifyMessageHandlers(event, data) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(event, data)
      } catch (error) {
        console.error('❌ Error in message handler:', error)
      }
    })
  }

  // Notify connection handlers
  notifyConnectionHandlers(connected) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected)
      } catch (error) {
        console.error('❌ Error in connection handler:', error)
      }
    })
  }

  // Get connection status
  isConnected() {
    return this.connected
  }

  // Get current site ID
  getSiteId() {
    return this.siteId
  }

  // Get current session ID
  getSessionId() {
    return this.sessionId
  }
}

// Create singleton instance
const chatService = new ChatService()

export default chatService