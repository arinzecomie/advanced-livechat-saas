/**
 * Login Form Validation Schema
 * Yup validation for login form fields
 */
import * as yup from 'yup'

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
})

export const loginDefaultValues = {
  email: '',
  password: ''
}