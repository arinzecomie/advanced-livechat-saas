import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const useDashboardStore = create(
  immer((set, get) => ({
    // State
    sites: [],
    currentSite: null,
    analytics: null,
    visitors: [],
    messages: [],
    isLoading: false,
    error: null,
    stats: {
      totalVisitors: 0,
      totalMessages: 0,
      activeChats: 0,
      conversionRate: 0,
    },

    // Actions
    setSites: (sites) => set((state) => {
      state.sites = sites
    }),

    setCurrentSite: (site) => set((state) => {
      state.currentSite = site
    }),

    setAnalytics: (analytics) => set((state) => {
      state.analytics = analytics
    }),

    setVisitors: (visitors) => set((state) => {
      state.visitors = visitors
    }),

    setMessages: (messages) => set((state) => {
      state.messages = messages
    }),

    setLoading: (loading) => set((state) => {
      state.isLoading = loading
    }),

    setError: (error) => set((state) => {
      state.error = error
    }),

    setStats: (stats) => set((state) => {
      state.stats = { ...state.stats, ...stats }
    }),

    // Dashboard actions
    fetchSites: async () => {
      const { setLoading, setError, setSites } = get()
      
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token')
        }

        const response = await fetch('http://localhost:3000/api/dashboard/sites', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch sites')
        }

        const data = await response.json()
        setSites(data.sites || [])
        
        return { success: true, data }
      } catch (error) {
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    fetchSiteAnalytics: async (siteId) => {
      const { setLoading, setError, setAnalytics, setStats } = get()
      
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token')
        }

        const response = await fetch(`http://localhost:3000/api/dashboard/sites/${siteId}/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }

        const data = await response.json()
        setAnalytics(data)
        
        // Update stats
        setStats({
          totalVisitors: data.totalVisitors || 0,
          totalMessages: data.totalMessages || 0,
          activeChats: data.activeChats || 0,
          conversionRate: data.conversionRate || 0,
        })
        
        return { success: true, data }
      } catch (error) {
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    fetchSiteVisitors: async (siteId) => {
      const { setLoading, setError, setVisitors } = get()
      
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token')
        }

        const response = await fetch(`http://localhost:3000/api/dashboard/sites/${siteId}/visitors`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch visitors')
        }

        const data = await response.json()
        setVisitors(data.visitors || [])
        
        return { success: true, data }
      } catch (error) {
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    fetchSiteMessages: async (siteId) => {
      const { setLoading, setError, setMessages } = get()
      
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token')
        }

        const response = await fetch(`http://localhost:3000/api/dashboard/sites/${siteId}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch messages')
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

    createSite: async (siteData) => {
      const { setLoading, setError, fetchSites } = get()
      
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token')
        }

        const response = await fetch('http://localhost:3000/api/dashboard/sites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(siteData),
        })

        if (!response.ok) {
          throw new Error('Failed to create site')
        }

        const data = await response.json()
        
        // Refresh sites list
        await fetchSites()
        
        return { success: true, data }
      } catch (error) {
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    updateSite: async (siteId, siteData) => {
      const { setLoading, setError, fetchSites } = get()
      
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token')
        }

        const response = await fetch(`http://localhost:3000/api/dashboard/sites/${siteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(siteData),
        })

        if (!response.ok) {
          throw new Error('Failed to update site')
        }

        const data = await response.json()
        
        // Refresh sites list
        await fetchSites()
        
        return { success: true, data }
      } catch (error) {
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    deleteSite: async (siteId) => {
      const { setLoading, setError, fetchSites } = get()
      
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token')
        }

        const response = await fetch(`http://localhost:3000/api/dashboard/sites/${siteId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to delete site')
        }

        // Refresh sites list
        await fetchSites()
        
        return { success: true }
      } catch (error) {
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    // Admin actions
    fetchAdminStats: async () => {
      const { setLoading, setError, setStats } = get()
      
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token')
        }

        const response = await fetch('http://localhost:3000/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch admin stats')
        }

        const data = await response.json()
        setStats(data)
        
        return { success: true, data }
      } catch (error) {
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    // Utility actions
    selectSite: (site) => {
      const { setCurrentSite } = get()
      setCurrentSite(site)
      
      // Load site-specific data
      if (site) {
        get().fetchSiteAnalytics(site.site_id)
        get().fetchSiteVisitors(site.site_id)
        get().fetchSiteMessages(site.site_id)
      }
    },

    clearError: () => {
      set((state) => {
        state.error = null
      })
    },

    resetDashboard: () => {
      set((state) => {
        state.sites = []
        state.currentSite = null
        state.analytics = null
        state.visitors = []
        state.messages = []
        state.error = null
        state.stats = {
          totalVisitors: 0,
          totalMessages: 0,
          activeChats: 0,
          conversionRate: 0,
        }
      })
    },
  }))
)

export default useDashboardStore