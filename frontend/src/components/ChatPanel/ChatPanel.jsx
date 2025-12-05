/**
 * Chat Panel Component
 * Real-time chat interface with Zustand state management
 */
import React, { useState, useEffect, useRef } from 'react'
import { useChatStore } from '../../stores'

const ChatPanel = ({ siteId, sessionId, serverUrl = 'http://localhost:3000' }) => {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const {
    messages,
    isConnected,
    typingUsers,
    currentSession,
    sendMessage: sendChatMessage,
    sendTypingIndicator,
    loadMessages,
    setMessages,
  } = useChatStore()

  // Initialize chat when component mounts
  useEffect(() => {
    if (siteId && sessionId) {
      loadMessages(siteId, sessionId)
    }
  }, [siteId, sessionId, loadMessages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle typing indicator
  useEffect(() => {
    if (message.trim()) {
      if (!isTyping) {
        setIsTyping(true)
        sendTypingIndicator(true)
      }
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        sendTypingIndicator(false)
      }, 1000)
    } else {
      setIsTyping(false)
      sendTypingIndicator(false)
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [message, sendTypingIndicator, isTyping])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!message.trim()) return

    sendChatMessage(message, 'admin')
    setMessage('')
    setIsTyping(false)
    sendTypingIndicator(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const isVisitorTyping = typingUsers.includes(currentSession?.visitor?.id)

  const handleRefreshMessages = () => {
    if (siteId && sessionId) {
      loadMessages(siteId, sessionId)
    }
  }

  const handleClearMessages = () => {
    setMessages([])
  }

  return (
    <div className="card chat-panel">
      {/* Chat Header */}
      <div className="card-header bg-primary text-white">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              <i className="fas fa-comments me-2"></i>
              Live Chat
            </h5>
            <small className="opacity-75">
              {isConnected ? (
                <>
                  <span className="status-indicator status-online"></span>
                  Connected
                </>
              ) : (
                <>
                  <span className="status-indicator status-offline"></span>
                  Disconnected
                </>
              )}
            </small>
          </div>
          <div>
            <button 
              className="btn btn-sm btn-outline-light me-2" 
              onClick={handleRefreshMessages}
              title="Refresh messages"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
            <button 
              className="btn btn-sm btn-outline-light" 
              onClick={handleClearMessages}
              title="Clear messages"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-comments"></i>
            <p>No messages yet</p>
            <small className="text-muted">
              {isConnected ? 'Start the conversation!' : 'Connecting to chat server...'}
            </small>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.sender === 'visitor' ? 'visitor' : 'admin'}`}
            >
              <div>{message.text}</div>
              <div className="message-time">
                {formatTime(message.createdAt || message.timestamp)}
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {isVisitorTyping && (
          <div className="message visitor">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input">
        <form onSubmit={handleSendMessage} className="d-flex">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="form-control me-2"
            placeholder="Type your message..."
            rows="1"
            disabled={!isConnected}
            style={{ resize: 'none' }}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={!isConnected || !message.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatPanel