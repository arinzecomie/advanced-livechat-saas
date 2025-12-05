/**
 * Login Page Component
 * User authentication page
 */
import React from 'react'
import { Link } from 'react-router-dom'
import LoginForm from '../components/forms/LoginForm'

const Login = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="text-center mb-4">
            <Link to="/" className="text-decoration-none">
              <h1 className="display-6 fw-bold text-primary">
                <i className="fas fa-comments me-2"></i>
                Advanced Live Chat
              </h1>
            </Link>
            <p className="text-muted">Sign in to your account</p>
          </div>
          
          <LoginForm />
          
          <div className="text-center mt-4">
            <p className="text-muted">
              <small>
                Demo credentials: admin@example.com / admin123
              </small>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login