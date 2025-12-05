/**
 * Authentication Hook
 * Manages user authentication state and operations with Zustand
 */
import { useEffect } from 'react'
import { useAuthStore } from '../stores'

export const useAuth = () => {
  const { user, token, isLoading, error, isAuthenticated, fetchUserProfile, initializeAuth } = useAuthStore()

  useEffect(() => {
    // Initialize auth state on mount
    initializeAuth()
  }, [initializeAuth])

  // Handle token expiration
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        // Token was removed, force re-authentication
        useAuthStore.getState().logout()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Fetch user profile when token changes
  useEffect(() => {
    if (token && !user) {
      fetchUserProfile()
    }
  }, [token, user, fetchUserProfile])

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    role: user?.role || null,
  }
}