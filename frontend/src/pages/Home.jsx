/**
 * Home Page Component
 * Landing page with feature overview and demo
 */
import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  const features = [
    {
      icon: '⚡',
      title: 'Real-time Messaging',
      description: 'Instant message delivery with Socket.IO technology for seamless customer communication.'
    },
    {
      icon: '🔒',
      title: 'Multi-tenant Security',
      description: 'Secure, isolated chat environments for each site with JWT authentication and role-based access.'
    },
    {
      icon: '📊',
      title: 'Visitor Analytics',
      description: 'Track visitor activity, engagement metrics, and chat history with detailed analytics dashboard.'
    },
    {
      icon: '💳',
      title: 'Subscription Management',
      description: 'Built-in payment tracking with trial, active, and suspended site states for SaaS billing.'
    },
    {
      icon: '🎨',
      title: 'Customizable Widget',
      description: 'Easily embeddable chat widget that can be customized to match your website design.'
    },
    {
      icon: '🚀',
      title: 'Easy Integration',
      description: 'Simple JavaScript snippet integration that works with any website or platform.'
    }
  ]

  return (
    <div>
      {/* Hero Section */}
      <div className="dashboard-header">
        <div className="container">
          <div className="row align-items-center min-vh-50">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Advanced Live Chat SaaS
              </h1>
              <p className="lead mb-4">
                Transform your customer engagement with our cutting-edge live chat solution. 
                Real-time messaging, powerful analytics, and seamless integration.
              </p>
              <div className="d-flex gap-3">
                <Link to="/signup" className="btn btn-light btn-lg">
                  <i className="fas fa-rocket me-2"></i>
                  Get Started Free
                </Link>
                <a href="/demo.html" className="btn btn-outline-light btn-lg">
                  <i className="fas fa-play me-2"></i>
                  View Demo
                </a>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="text-center">
                <div className="display-1 mb-4">
                  💬
                </div>
                <p className="fs-5 text-white-50">
                  Join thousands of businesses using our platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Why Choose Advanced Live Chat?</h2>
            <p className="lead text-muted">
              Everything you need to provide exceptional customer support
            </p>
          </div>
          
          <div className="row g-4">
            {features.map((feature, index) => (
              <div key={index} className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body text-center p-4">
                    <div className="feature-icon mb-3">
                      <span style={{ fontSize: '3rem' }}>{feature.icon}</span>
                    </div>
                    <h5 className="card-title mb-3">{feature.title}</h5>
                    <p className="card-text text-muted">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="bg-light py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="display-5 fw-bold mb-4">See It In Action</h2>
              <p className="lead mb-4">
                Experience our live chat widget on a demo website. See how easy it is 
                for visitors to start conversations and for your team to respond.
              </p>
              <div className="mb-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                    <i className="fas fa-check"></i>
                  </div>
                  <span>Real-time messaging</span>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                    <i className="fas fa-check"></i>
                  </div>
                  <span>Visitor tracking & analytics</span>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                    <i className="fas fa-check"></i>
                  </div>
                  <span>Mobile responsive design</span>
                </div>
              </div>
              <a href="/demo.html" className="btn btn-primary btn-lg">
                <i className="fas fa-external-link-alt me-2"></i>
                Try Live Demo
              </a>
            </div>
            <div className="col-lg-6">
              <div className="text-center">
                <div className="card shadow-lg">
                  <div className="card-body p-5">
                    <div className="mb-4">
                      <i className="fas fa-mobile-alt fa-3x text-primary"></i>
                    </div>
                    <h5>Works on All Devices</h5>
                    <p className="text-muted">
                      Our widget automatically adapts to desktop, tablet, and mobile screens.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-5">
        <div className="container text-center">
          <h2 className="display-5 fw-bold mb-4">Ready to Get Started?</h2>
          <p className="lead mb-4">
            Join thousands of businesses providing exceptional customer support
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/signup" className="btn btn-primary btn-lg">
              <i className="fas fa-rocket me-2"></i>
              Start Free Trial
            </Link>
            <Link to="/login" className="btn btn-outline-primary btn-lg">
              <i className="fas fa-sign-in-alt me-2"></i>
              Sign In
            </Link>
          </div>
          <p className="text-muted mt-3">
            <small>Free 30-day trial • No credit card required • Easy setup</small>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home