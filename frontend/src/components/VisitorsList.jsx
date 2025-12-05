/**
 * Visitors List Component
 * Displays active visitors with Zustand state management
 */
import React, { useState, useEffect } from 'react'
import { useDashboardStore } from '../stores'

const VisitorsList = ({ siteId }) => {
  const [refreshing, setRefreshing] = useState(false)
  
  const {
    visitors,
    isLoading,
    error,
    fetchSiteVisitors,
  } = useDashboardStore()

  useEffect(() => {
    if (siteId) {
      fetchSiteVisitors(siteId)
    }
  }, [siteId, fetchSiteVisitors])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSiteVisitors(siteId)
    setRefreshing(false)
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDuration = (startTime) => {
    const duration = Date.now() - new Date(startTime).getTime()
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  const getBrowserIcon = (userAgent) => {
    if (userAgent.includes('Chrome')) return 'fab fa-chrome'
    if (userAgent.includes('Firefox')) return 'fab fa-firefox'
    if (userAgent.includes('Safari')) return 'fab fa-safari'
    if (userAgent.includes('Edge')) return 'fab fa-edge'
    return 'fas fa-globe'
  }

  const getDeviceType = (userAgent) => {
    if (userAgent.includes('Mobile')) return 'Mobile'
    if (userAgent.includes('Tablet')) return 'Tablet'
    return 'Desktop'
  }

  if (isLoading && visitors.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading visitors...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
          <button className="btn btn-primary" onClick={handleRefresh}>
            <i className="fas fa-sync-alt me-2"></i>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="fas fa-users me-2"></i>
          Active Visitors ({visitors.length})
        </h5>
        <button 
          className={`btn btn-sm btn-outline-primary ${refreshing ? 'disabled' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i>
        </button>
      </div>
      
      <div className="card-body p-0">
        {visitors.length === 0 ? (
          <div className="text-center py-4">
            <i className="fas fa-users-slash text-muted" style={{ fontSize: '2rem' }}></i>
            <p className="text-muted mt-2">No active visitors</p>
            <small className="text-muted">Visitors will appear here when they join your site</small>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {visitors.map((visitor) => (
              <div key={visitor.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="d-flex align-items-center">
                    <div className="visitor-avatar me-3">
                      <i className="fas fa-user-circle text-primary" style={{ fontSize: '1.5rem' }}></i>
                    </div>
                    <div>
                      <div className="d-flex align-items-center mb-1">
                        <small className="text-muted me-2">
                          #{visitor.fingerprint?.slice(-6)}
                        </small>
                        <span className={`badge ${visitor.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {visitor.isActive ? 'Active' : 'Idle'}
                        </span>
                      </div>
                      <div className="small text-muted">
                        <i className={`${getBrowserIcon(visitor.meta?.userAgent)} me-1`}></i>
                        {getDeviceType(visitor.meta?.userAgent)} • 
                        <i className="fas fa-clock ms-1 me-1"></i>
                        {formatDuration(visitor.firstSeen)}
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="small text-muted mb-1">
                      {formatTime(visitor.lastSeen)}
                    </div>
                    {visitor.currentPage && (
                      <div className="small text-truncate" style={{ maxWidth: '150px' }}>
                        <i className="fas fa-link me-1"></i>
                        {visitor.currentPage}
                      </div>
                    )}
                  </div>
                </div>
                
                {visitor.meta?.location && (
                  <div className="mt-2 small text-muted">
                    <i className="fas fa-map-marker-alt me-1"></i>
                    {visitor.meta.location.city}, {visitor.meta.location.country}
                  </div>
                )}
                
                <div className="mt-2 d-flex gap-1">
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {/* Handle start chat */}}
                  >
                    <i className="fas fa-comment me-1"></i>
                    Chat
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {/* Handle view details */}}
                  >
                    <i className="fas fa-eye me-1"></i>
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {visitors.length > 0 && (
        <div className="card-footer text-muted small">
          <i className="fas fa-info-circle me-1"></i>
          Showing {visitors.length} active visitor{visitors.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

export default VisitorsList