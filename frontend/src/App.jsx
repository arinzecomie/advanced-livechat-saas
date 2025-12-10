/**
 * Main App Component
 * Handles routing, authentication, and layout with Zustand
 */
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import SuperAdminDashboard from './pages/SuperAdminDashboard'

function App() {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  console.log('App.jsx - User:', user)
  console.log('App.jsx - isAuthenticated:', isAuthenticated)
  console.log('App.jsx - isLoading:', isLoading)

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" replace />} />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/admin" 
          element={isAuthenticated && user?.role === 'admin' ? <Admin /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/super-admin" 
          element={isAuthenticated && user?.role === 'admin' ? <SuperAdminDashboard /> : <Navigate to="/dashboard" replace />} 
        />
      </Routes>
    </div>
  )
}

export default App