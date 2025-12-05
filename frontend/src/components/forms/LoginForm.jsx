/**
 * Login Form Component
 * React Hook Form with Yup validation + Zustand state management
 */
import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { loginSchema, loginDefaultValues } from '../../validation/loginSchema'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores'

const LoginForm = () => {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: loginDefaultValues
  })

  const onSubmit = async (data) => {
    try {
      const result = await login(data)
      if (result.success) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div className="card">
      <div className="card-body p-4">
        <div className="text-center mb-4">
          <h3 className="card-title mb-3">
            <i className="fas fa-sign-in-alt me-2"></i>
            Welcome Back
          </h3>
          <p className="text-muted">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
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

          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              id="password"
              placeholder="Enter your password"
            />
            {errors.password && (
              <div className="invalid-feedback">
                {errors.password.message}
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
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Sign In
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-muted">
            Don't have an account?{' '}
            <a href="/signup" className="text-decoration-none">
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginForm