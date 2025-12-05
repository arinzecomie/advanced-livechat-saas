/**
 * Admin Page Component
 * Administrative dashboard with Zustand state management
 */
import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDashboardStore } from '../stores'

const Admin = () => {
  const { user } = useAuth()
  const {
    stats,
    isLoading,
    error,
    fetchAdminStats,
  } = useDashboardStore()

  useEffect(() => {
    // Fetch admin stats on component mount
    fetchAdminStats()
  }, [fetchAdminStats])

  const handleRefreshStats = async () => {
    await fetchAdminStats()
  }

  const handleCreateUser = () => {
    // TODO: Implement user creation modal
    console.log('Create user clicked')
  }

  const handleCreateSite = () => {
    // TODO: Implement site creation modal
    console.log('Create site clicked')
  }

  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading admin panel...</span>
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
          Failed to load admin panel: {error}
        </div>
        <button className="btn btn-primary" onClick={handleRefreshStats}>
          <i className="fas fa-sync-alt me-2"></i>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="display-6 fw-bold">
            <i className="fas fa-cog me-2"></i>
            Admin Panel
          </h1>
          <p className="text-muted">System administration and management</p>
        </div>
      </div>

      {/* System Overview */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                <i className="fas fa-chart-line me-2"></i>
                System Overview
              </h5>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={handleRefreshStats}
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="display-4 text-primary">{stats?.totalUsers || 0}</div>
                  <div className="text-muted">Total Users</div>
                </div>
                <div className="col-md-3">
                  <div className="display-4 text-success">{stats?.activeSites || 0}</div>
                  <div className="text-muted">Active Sites</div>
                </div>
                <div className="col-md-3">
                  <div className="display-4 text-warning">{stats?.trialSites || 0}</div>
                  <div className="text-muted">Trial Sites</div>
                </div>
                <div className="col-md-3">
                  <div className="display-4 text-info">{stats?.suspendedSites || 0}</div>
                  <div className="text-muted">Suspended Sites</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <button className="btn btn-primary w-100" onClick={handleCreateUser}>
                    <i className="fas fa-user-plus me-2"></i>
                    Create User
                  </button>
                </div>
                <div className="col-md-4 mb-3">
                  <button className="btn btn-success w-100" onClick={handleCreateSite}>
                    <i className="fas fa-plus-circle me-2"></i>
                    Create Site
                  </button>
                </div>
                <div className="col-md-4 mb-3">
                  <button className="btn btn-info w-100" onClick={handleRefreshStats}>
                    <i className="fas fa-sync-alt me-2"></i>
                    Refresh Stats
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="row">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-users me-2"></i>
                Recent Users
              </h5>
            </div>
            <div className="card-body">
              {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                <div className="list-group list-group-flush">
                  {stats.recentUsers.map((user, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">{user.name}</h6>
                        <small className="text-muted">{user.email}</small>
                      </div>
                      <span className={`badge bg-${user.role === 'admin' ? 'danger' : 'primary'}`}>
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-users fa-2x mb-3"></i>
                  <p>No recent users</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-credit-card me-2"></i>
                Recent Payments
              </h5>
            </div>
            <div className="card-body">
              {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                <div className="list-group list-group-flush">
                  {stats.recentPayments.map((payment, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">${payment.amount} {payment.currency}</h6>
                        <small className="text-muted">{payment.siteDomain}</small>
                      </div>
                      <span className={`badge bg-${payment.status === 'completed' ? 'success' : 'warning'}`}>
                        {payment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-credit-card fa-2x mb-3"></i>
                  <p>No recent payments</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin