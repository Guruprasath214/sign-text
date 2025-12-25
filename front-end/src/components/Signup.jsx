import { useState } from 'react'
import { FaEnvelope, FaEye, FaEyeSlash, FaLock } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuthStore from '../store/authStore'

function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  
  const { signup, loading } = useAuthStore()
  const navigate = useNavigate()

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Password validation
  const validatePassword = (password) => {
    const minLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear errors when user starts typing
    if (errors[name] || errors.general) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        delete newErrors.general
        return newErrors
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate all fields
    const newErrors = {}
    
    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required'
      toast.error('Please enter your email address')
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format'
      toast.error('Please enter a valid email address')
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required'
      toast.error('Please create a password')
    } else {
      const passwordCheck = validatePassword(formData.password)
      if (!passwordCheck.minLength) {
        newErrors.password = 'Password must be at least 8 characters'
        toast.error('Password must be at least 8 characters long')
      } else if (!passwordCheck.hasUpperCase) {
        newErrors.password = 'Password must contain uppercase letter'
        toast.error('Password must contain at least one uppercase letter')
      } else if (!passwordCheck.hasLowerCase) {
        newErrors.password = 'Password must contain lowercase letter'
        toast.error('Password must contain at least one lowercase letter')
      } else if (!passwordCheck.hasNumber) {
        newErrors.password = 'Password must contain a number'
        toast.error('Password must contain at least one number')
      }
    }
    
    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
      toast.error('Please confirm your password')
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
      toast.error('Passwords do not match')
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    try {
      // Attempt signup
      const result = await signup(formData.email, formData.password, formData.confirmPassword)
      
      if (result.success) {
        toast.success('✅ Account created successfully! Welcome!')
        navigate('/dashboard')
      } else {
        // Display error notification
        const errorMessage = result.error || 'Signup failed. Please try again.'
        
        // Show prominent error toast
        toast.error(`❌ ${errorMessage}`, {
          position: "top-center",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
        
        // Set field-level errors
        if (errorMessage.toLowerCase().includes('email')) {
          setErrors({ email: errorMessage })
        } else if (errorMessage.toLowerCase().includes('password')) {
          setErrors({ password: errorMessage })
        } else if (errorMessage.toLowerCase().includes('exist')) {
          setErrors({ email: 'This email is already registered' })
        } else {
          setErrors({ email: errorMessage })
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('❌ Connection error. Please check your internet and try again.', {
        position: "top-center",
        autoClose: 4000,
      })
      setErrors({ email: 'Connection error' })
    }
  }

  const passwordStrength = validatePassword(formData.password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl fade-in">
        
        {/* Header */}
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join SecureCall for free video calling
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field pl-10 ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
  
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className={`input-field pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                ) : (
                  <FaEye className="text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <span className={passwordStrength.minLength ? 'text-green-600' : 'text-gray-400'}>
                    ✓ 8+ characters
                  </span>
                  <span className={passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-400'}>
                    ✓ Uppercase
                  </span>
                  <span className={passwordStrength.hasLowerCase ? 'text-green-600' : 'text-gray-400'}>
                    ✓ Lowercase
                  </span>
                  <span className={passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}>
                    ✓ Number
                  </span>
                </div>
              </div>
            )}
            
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                ) : (
                  <FaEye className="text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-secondary">
                Login here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup
