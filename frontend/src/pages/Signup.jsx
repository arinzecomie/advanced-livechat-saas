/**
 * Signup Page Component
 * User registration page
 */
import React from 'react'
import { Link } from 'react-router-dom'
import SignupForm from '../components/forms/SignupForm'

const Signup = () => {
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
            <p className="text-muted">Create your account</p>
          </div>
          
          <SignupForm />
          
          <div className="text-center mt-4">
            <p className="text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-decoration-none">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup