import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { io } from 'socket.io-client'

const useChatStore = create(
  immer((set, get) => ({
    // State
    socket: null,
    isConnected: false,
    messages: [],
    currentSession: null,
    siteConfig: null,
    isLoading: false,
    error: null,
    typingUsers: [],

    // Actions
    setSocket: (socket) => set((state) => {
      state.socket = socket
    }),

    setConnectionStatus: (status) => set((state) => {
      state.isConnected = status
    }),

    setMessages: (messages) => set((state) => {
      state.messages = messages
    }),

    addMessage: (message) => set((state) => {
      state.messages.push(message)
    }),

    setCurrentSession: (session) => set((state) => {
      state.currentSession = session
    }),

    setSiteConfig: (config) => set((state) => {
      state.siteConfig = config
    }),

    setLoading: (loading) => set((state) => {
      state.isLoading = loading
    }),

    setError: (error) => set((state) => {
      state.error = error
    }),

    setTypingUsers: (users) => set((state) => {
      state.typingUsers = users
    }),

    // Chat actions
    initializeSocket: (siteId, serverUrl = 'http://localhost:3000') => {
      const { setSocket, setConnectionStatus, handleSocketEvents } = get()
      
      if (get().socket) {
        get().disconnectSocket()
      }

      const socket = io(serverUrl, {
        query: { siteId },
        transports: ['websocket', 'polling'],
      })

      setSocket(socket)
      handleSocketEvents(socket)
    },

    handleSocketEvents: (socket) => {
      const { setConnectionStatus, addMessage, setTypingUsers } = get()

      socket.on('connect', () => {
        setConnectionStatus(true)
        console.log('Connected to chat server')
      })

      socket.on('disconnect', () => {
        setConnectionStatus(false)
        console.log('Disconnected from chat server')
      })

      socket.on('message', (message) => {
        addMessage(message)
      })

      socket.on('typing', ({ userId, isTyping }) => {
        const { typingUsers } = get()
        if (isTyping) {
          if (!typingUsers.includes(userId)) {
            setTypingUsers([...typingUsers, userId])
          }
        } else {
          setTypingUsers(typingUsers.filter(id => id !== userId))
        }
      })

      socket.on('session_created', (session) => {
        set((state) => {
          state.currentSession = session
        })
      })
    },

    sendMessage: (text, sender = 'visitor') => {
      const { socket, currentSession } = get()
      
      if (!socket || !currentSession) return

      const message = {
        text,
        sender,
        sessionId: currentSession.id,
        timestamp: new Date().toISOString(),
      }

      socket.emit('message', message)
      
      // Add to local state immediately for better UX
      get().addMessage(message)
    },

    sendTypingIndicator: (isTyping) => {
      const { socket, currentSession } = get()
      
      if (!socket || !currentSession) return

      socket.emit('typing', { isTyping })
    },

    disconnectSocket: () => {
      const { socket } = get()
      if (socket) {
        socket.disconnect()
        set((state) => {
          state.socket = null
          state.isConnected = false
        })
      }
    },

    // Widget initialization
    initializeWidget: async (siteId, serverUrl = 'http://localhost:3000') => {
      const { setLoading, setError, setCurrentSession, setSiteConfig, initializeSocket } = get()
      
      try {
        setLoading(true)
        setError(null)

        // Register visitor
        const visitorResponse = await fetch(`${serverUrl}/api/widget/visit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            siteId,
            fingerprint: localStorage.getItem('visitorFingerprint') || `visitor-${Date.now()}`,
            page: window.location.pathname,
          }),
        })

        if (!visitorResponse.ok) {
          throw new Error('Failed to register visitor')
        }

        const visitorData = await visitorResponse.json()
        
        // Store fingerprint for future visits
        localStorage.setItem('visitorFingerprint', visitorData.data.visitor.fingerprint)
        
        setCurrentSession(visitorData.data)

        // Get site configuration
        const configResponse = await fetch(`${serverUrl}/api/widget/config/${siteId}`)
        if (configResponse.ok) {
          const configData = await configResponse.json()
          setSiteConfig(configData)
        }

        // Initialize socket connection
        initializeSocket(siteId, serverUrl)

        return { success: true, data: visitorData }
      } catch (error) {
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    // Load message history
    loadMessages: async (siteId, sessionId) => {
      const { setLoading, setError, setMessages } = get()
      
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`http://localhost:3000/api/messages/${siteId}/${sessionId}`)
        
        if (!response.ok) {
          throw new Error('Failed to load messages')
        }

        const data = await response.json()
        setMessages(data.messages || [])
        
        return { success: true, data }
      } catch (error) {
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },
  }))
)

export default useChatStore