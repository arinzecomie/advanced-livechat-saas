import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const useAuthStore = create(
  immer((set, get) => ({
    // State
    user: null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null,
    isAuthenticated: false,

    // Actions
    setUser: (user) => set((state) => {
      state.user = user
      state.isAuthenticated = !!user
    }),

    setToken: (token) => set((state) => {
      state.token = token
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    }),

    setLoading: (loading) => set((state) => {
      state.isLoading = loading
    }),

    setError: (error) => set((state) => {
      state.error = error
    }),

    // Auth actions
    login: async (credentials) => {
      const { setLoading, setError, setUser, setToken } = get()
      
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Login failed')
        }

        const data = await response.json()
        
        setToken(data.token)
        setUser(data.user)
        
        return { success: true, data }
      } catch (error) {
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    logout: () => {
      const { setUser, setToken } = get()
      setUser(null)
      setToken(null)
    },

    fetchUserProfile: async () => {
      const { setLoading, setError, setUser, token } = get()
      
      if (!token) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch('http://localhost:3000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            // Token invalid, logout
            get().logout()
          }
          throw new Error('Failed to fetch profile')
        }

        const data = await response.json()
        setUser(data)
        
        return { success: true, data }
      } catch (error) {
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    // Initialize auth state
    initializeAuth: async () => {
      const { token, fetchUserProfile } = get()
      if (token) {
        await fetchUserProfile()
      }
    },
  }))
)

export default useAuthStore