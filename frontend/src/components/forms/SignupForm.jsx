/**
 * Signup Form Component
 * React Hook Form with Yup validation + Zustand state management
 */
import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { signupSchema, signupDefaultValues } from '../../validation/signupSchema'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores'

const SignupForm = () => {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm({
    resolver: yupResolver(signupSchema),
    defaultValues: signupDefaultValues
  })

  const password = watch('password')

  const onSubmit = async (data) => {
    try {
      // Remove confirmPassword from submission
      const { confirmPassword, ...userData } = data
      
      // Register user (we'll implement this in the authStore)
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }

      // Auto-login after successful registration
      const result = await login({
        email: userData.email,
        password: userData.password
      })

      if (result.success) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Registration failed:', error)
    }
  }

  return (
    <div className="card">
      <div className="card-body p-4">
        <div className="text-center mb-4">
          <h3 className="card-title mb-3">
            <i className="fas fa-user-plus me-2"></i>
            Create Account
          </h3>
          <p className="text-muted">Join Advanced Live Chat SaaS today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              {...register('name')}
              type="text"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              id="name"
              placeholder="Enter your full name"
            />
            {errors.name && (
              <div className="invalid-feedback">
                {errors.name.message}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              id="email"
              placeholder="Enter your email"
            />
            {errors.email && (
              <div className="invalid-feedback">
                {errors.email.message}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              id="password"
              placeholder="Create a strong password"
            />
            {errors.password && (
              <div className="invalid-feedback">
                {errors.password.message}
              </div>
            )}
            {password && (
              <div className="form-text">
                <small className="text-muted">
                  Password strength: {password.length >= 8 ? 'Strong' : password.length >= 6 ? 'Medium' : 'Weak'}
                </small>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
              id="confirmPassword"
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <div className="invalid-feedback">
                {errors.confirmPassword.message}
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <div className="d-grid">
            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i>
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-muted">
            Already have an account?{' '}
            <a href="/login" className="text-decoration-none">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignupForm