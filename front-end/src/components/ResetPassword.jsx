import { useEffect, useState } from 'react'
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuthStore from '../store/authStore'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { resetPassword, loading } = useAuthStore()
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [tokenValid, setTokenValid] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Verify token on component mount
    const token = searchParams.get('token')
    
    if (!token) {
      toast.error('Invalid reset link')
      navigate('/forgot-password')
      return
    }

    // Check if token is valid
    const resetData = localStorage.getItem('passwordReset')
    
    if (!resetData) {
      toast.error('Reset link has expired or is invalid')
      navigate('/forgot-password')
      return
    }

    const { token: storedToken, expires, email: userEmail } = JSON.parse(resetData)

    // Verify token matches and hasn't expired
    if (token !== storedToken) {
      toast.error('Invalid reset link')
      navigate('/forgot-password')
      return
    }

    if (Date.now() > expires) {
      toast.error('Reset link has expired. Please request a new one.')
      localStorage.removeItem('passwordReset')
      navigate('/forgot-password')
      return
    }

    setTokenValid(true)
    setEmail(userEmail)
  }, [searchParams, navigate])

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
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = {}
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const passwordCheck = validatePassword(formData.password)
      if (!passwordCheck.isValid) {
        newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number'
      }
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      // Reset password
      const result = await resetPassword(email, formData.password)
      
      if (result.success) {
        // Clear reset data from localStorage
        localStorage.removeItem('passwordReset')
        
        toast.success('✅ Password reset successfully! You can now login with your new password.')
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        toast.error(`❌ ${result.error || 'Failed to reset password'}`, {
          position: "top-center",
          autoClose: 4000,
        })
      }
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error('❌ An error occurred. Please try again.', {
        position: "top-center",
        autoClose: 4000,
      })
    }
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-beige to-royal-blue/20">
        <div className="spinner"></div>
      </div>
    )
  }

  const passwordStrength = validatePassword(formData.password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-beige to-royal-blue/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl fade-in">
        
        {/* Header */}
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password for <strong>{email}</strong>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
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
              Confirm New Password
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
                'Reset Password'
              )}
            </button>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <Link to="/login" className="text-sm font-medium text-primary hover:text-secondary">
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
