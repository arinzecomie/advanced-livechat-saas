/**
 * Dashboard Page Component
 * Main user dashboard with Zustand state management
 */
import React, { useState, useEffect } from 'react'
import { useDashboardStore } from '../stores'
import VisitorsList from '../components/VisitorsList'
import ChatPanel from '../components/ChatPanel/ChatPanel'

const Dashboard = () => {
  const [selectedSite, setSelectedSite] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  
  const {
    sites,
    currentSite,
    analytics,
    isLoading,
    error,
    fetchSites,
    selectSite,
  } = useDashboardStore()

  useEffect(() => {
    // Fetch sites on component mount
    fetchSites()
  }, [fetchSites])

  useEffect(() => {
    // Auto-select first site if available
    if (sites.length > 0 && !currentSite) {
      selectSite(sites[0])
      setSelectedSite(sites[0])
    }
  }, [sites, currentSite, selectSite])

  // Update selected site when current site changes
  useEffect(() => {
    if (currentSite) {
      setSelectedSite(currentSite)
    }
  }, [currentSite])

  if (isLoading && sites.length === 0) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Failed to load dashboard: {error}
        </div>
        <button className="btn btn-primary" onClick={fetchSites}>
          <i className="fas fa-sync-alt me-2"></i>
          Retry
        </button>
      </div>
    )
  }

  const hasSites = sites.length > 0

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="display-6 fw-bold">
            <i className="fas fa-tachometer-alt me-2"></i>
            Dashboard
          </h1>
          <p className="text-muted">Manage your sites and monitor visitor activity</p>
        </div>
      </div>

      {/* Site Selector */}
      {hasSites && (
        <div className="row mb-4">
          <div className="col">
            <div className="card">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <label htmlFor="siteSelect" className="form-label fw-semibold">
                      Select Site:
                    </label>
                    <select
                      id="siteSelect"
                      className="form-select"
                      value={selectedSite?.site_id || ''}
                      onChange={(e) => {
                        const site = sites.find(s => s.site_id === e.target.value)
                        selectSite(site)
                        setSelectedSession(null)
                      }}
                    >
                      {sites.map(site => (
                        <option key={site.site_id} value={site.site_id}>
                          {site.domain} - {site.status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex gap-2 justify-content-md-end mt-3 mt-md-0">
                      <span className="badge bg-primary">
                        Site ID: {selectedSite?.site_id}
                      </span>
                      <span className={`badge bg-${selectedSite?.status === 'active' ? 'success' : selectedSite?.status === 'trial' ? 'warning' : 'danger'}`}>
                        {selectedSite?.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Sites Message */}
      {!hasSites && (
        <div className="row mb-4">
          <div className="col">
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="empty-state">
                  <i className="fas fa-rocket fa-3x text-muted mb-3"></i>
                  <h4>Welcome to Advanced Live Chat!</h4>
                  <p className="text-muted">
                    You don't have any sites yet. Create your first site to start engaging with visitors.
                  </p>
                  <button className="btn btn-primary btn-lg">
                    <i className="fas fa-plus me-2"></i>
                    Create Your First Site
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {hasSites && selectedSite && (
        <div className="row">
          {/* Left Column - Visitors */}
          <div className="col-lg-8">
            <div className="mb-4">
              <VisitorsList siteId={selectedSite.site_id} />
            </div>
          </div>

          {/* Right Column - Chat & Stats */}
          <div className="col-lg-4">
            {/* Chat Panel */}
            <div className="mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <i className="fas fa-comments me-2"></i>
                    Live Chat
                  </h5>
                </div>
                <div className="card-body p-0">
                  <ChatPanel 
                    siteId={selectedSite.site_id}
                    sessionId={selectedSession || 'default-session'}
                  />
                </div>
              </div>
            </div>

            {/* Site Stats */}
            <div className="card">
              <div className="card-header">
                <h6 className="card-title mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  Site Statistics
                </h6>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-6">
                    <div className="display-6 text-primary">
                      {analytics?.totalVisitors || selectedSite.stats?.totalVisitors || 0}
                    </div>
                    <small className="text-muted">Total Visitors</small>
                  </div>
                  <div className="col-6">
                    <div className="display-6 text-success">
                      {analytics?.activeVisitors || selectedSite.stats?.activeVisitors || 0}
                    </div>
                    <small className="text-muted">Active Now</small>
                  </div>
                </div>
                <hr />
                <div className="row text-center">
                  <div className="col-6">
                    <div className="display-6 text-info">
                      {analytics?.totalMessages || selectedSite.stats?.totalMessages || 0}
                    </div>
                    <small className="text-muted">Total Messages</small>
                  </div>
                  <div className="col-6">
                    <div className="display-6 text-warning">
                      {analytics?.conversionRate || selectedSite.stats?.conversionRate || 0}%
                    </div>
                    <small className="text-muted">Conversion Rate</small>
                  </div>
                </div>
                <hr />
                <div className="d-flex justify-content-between align-items-center">
                  <span>Status:</span>
                  <span className={`badge bg-${selectedSite.status === 'active' ? 'success' : selectedSite.status === 'trial' ? 'warning' : 'danger'}`}>
                    {selectedSite.status}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <span>Created:</span>
                  <small className="text-muted">
                    {new Date(selectedSite.created_at).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard