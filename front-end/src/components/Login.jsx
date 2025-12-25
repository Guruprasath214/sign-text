import { useRef, useState } from 'react'
import { FaEnvelope, FaEye, FaEyeSlash, FaLock } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuthStore from '../store/authStore'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [shake, setShake] = useState({ email: false, password: false })
  const shakeTimeout = useRef({ email: null, password: null });
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const { login, loading } = useAuthStore()
  const navigate = useNavigate()

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
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
      setShake(prev => ({ ...prev, [name]: false }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
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
      toast.error('Please enter your password')
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
      toast.error('Password must be at least 8 characters long')
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Shake affected inputs, and auto-clear animate-shake after 0.5s
      if (newErrors.email) {
        setShake(prev => ({ ...prev, email: false }));
        clearTimeout(shakeTimeout.current.email);
        shakeTimeout.current.email = setTimeout(() => setShake(s => ({ ...s, email: false })), 500);
        setShake(prev => ({ ...prev, email: true }));
        if (emailRef.current) emailRef.current.focus();
      }
      if (newErrors.password) {
        setShake(prev => ({ ...prev, password: false }));
        clearTimeout(shakeTimeout.current.password);
        shakeTimeout.current.password = setTimeout(() => setShake(s => ({ ...s, password: false })), 500);
        setShake(prev => ({ ...prev, password: true }));
        if (passwordRef.current) passwordRef.current.focus();
      }
      return;
    }
    
    try {
      // Attempt login
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        toast.success('✅ Login successful! Welcome back!')
        navigate('/dashboard')
      } else {
        const errorMessage = result.error || 'Invalid email or password'
        
        // Show error toast
        toast.error(`❌ ${errorMessage}`, {
          position: "top-center",
          autoClose: 4000,
        })
        
        let updateErrors = {};
        if (errorMessage.toLowerCase().includes('password')) {
          updateErrors = { password: errorMessage };
        } else if (errorMessage.toLowerCase().includes('email')) {
          updateErrors = { email: errorMessage };
        } else {
          updateErrors = {
            email: 'Invalid credentials',
            password: 'Invalid credentials',
          };
        }
        setErrors(updateErrors);
        // Trigger and auto-clear shake after 0.5s
        if (updateErrors.email) {
          setShake(prev => ({ ...prev, email: false }));
          clearTimeout(shakeTimeout.current.email);
          shakeTimeout.current.email = setTimeout(() => setShake(s => ({ ...s, email: false })), 500);
          setShake(prev => ({ ...prev, email: true }));
          if (emailRef.current) emailRef.current.focus();
        }
        if (updateErrors.password) {
          setShake(prev => ({ ...prev, password: false }));
          clearTimeout(shakeTimeout.current.password);
          shakeTimeout.current.password = setTimeout(() => setShake(s => ({ ...s, password: false })), 500);
          setShake(prev => ({ ...prev, password: true }));
          if (passwordRef.current) passwordRef.current.focus();
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('❌ Connection error. Please check your internet and try again.', {
        position: "top-center",
        autoClose: 4000,
      })
      setErrors({ 
        email: 'Connection error',
        password: 'Connection error'
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-beige to-royal-blue/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl fade-in">
        
        {/* Header */}
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your video calls
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
                className={`input-field pl-10 ${errors.email ? 'input-error' : ''} ${shake.email ? 'animate-shake' : ''}`}
                placeholder="you@example.com"
                ref={emailRef}
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
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className={`input-field pl-10 pr-10 ${errors.password ? 'input-error' : ''} ${shake.password ? 'animate-shake' : ''}`}
                placeholder="••••••••"
                ref={passwordRef}
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
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-secondary">
              Forgot password?
            </Link>
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
                'Sign In'
              )}
            </button>
          </div>

          {/* Signup Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-primary hover:text-secondary">
                Sign up now
              </Link>
            </p>
          </div>
        </form>

        {/* Security Note */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            🔒 Your connection is secured with end-to-end encryption
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
