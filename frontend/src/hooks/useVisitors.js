/**
 * Visitors Hook - manages visitor data and real-time updates
 * Custom hook for visitor analytics and tracking
 */
import { useState, useEffect } from 'react'
import { useSiteVisitors } from '../api/dashboardAPI'

export const useVisitors = (siteId, page = 1, limit = 20) => {
  const { data, isLoading, error, refetch } = useSiteVisitors(siteId, page, limit)
  const [visitors, setVisitors] = useState([])
  const [totalVisitors, setTotalVisitors] = useState(0)
  const [activeVisitors, setActiveVisitors] = useState(0)

  useEffect(() => {
    if (data?.data?.visitors) {
      setVisitors(data.data.visitors)
      setTotalVisitors(data.data.pagination?.total || 0)
      
      // Calculate active visitors (seen in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const activeCount = data.data.visitors.filter(visitor => {
        const lastSeen = new Date(visitor.last_seen)
        return lastSeen > fiveMinutesAgo
      }).length
      
      setActiveVisitors(activeCount)
    }
  }, [data])

  // Refresh visitors data
  const refreshVisitors = async () => {
    await refetch()
  }

  // Get visitor by ID
  const getVisitorById = (visitorId) => {
    return visitors.find(visitor => visitor.id === visitorId)
  }

  // Get recent visitors (last 24 hours)
  const getRecentVisitors = () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return visitors.filter(visitor => {
      const createdAt = new Date(visitor.created_at)
      return createdAt > twentyFourHoursAgo
    })
  }

  // Get visitor statistics
  const getVisitorStats = () => {
    if (!visitors.length) {
      return {
        total: 0,
        active: 0,
        newToday: 0,
        returning: 0
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const newToday = visitors.filter(visitor => {
      const createdAt = new Date(visitor.created_at)
      return createdAt >= today
    }).length

    const returning = visitors.filter(visitor => {
      const lastSeen = new Date(visitor.last_seen)
      const createdAt = new Date(visitor.created_at)
      return lastSeen > createdAt // Has been seen multiple times
    }).length

    return {
      total: totalVisitors,
      active: activeVisitors,
      newToday,
      returning
    }
  }

  return {
    visitors,
    isLoading,
    error,
    totalVisitors,
    activeVisitors,
    pagination: data?.data?.pagination || {},
    refreshVisitors,
    getVisitorById,
    getRecentVisitors,
    getVisitorStats
  }
}