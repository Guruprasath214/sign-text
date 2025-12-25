import emailjs from '@emailjs/browser'
import { useEffect, useState } from 'react'
import { FaEnvelope } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { EMAILJS_CONFIG } from '../config/emailjs.config'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY)
  }, [])

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const generateResetToken = () => {
    // Generate a random token
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      // Validate EmailJS configuration
      if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.TEMPLATE_ID || !EMAILJS_CONFIG.PUBLIC_KEY) {
        toast.error('Email service not configured. Please contact support.')
        console.error('EmailJS configuration missing')
        return
      }

      // Generate reset token
      const resetToken = generateResetToken()
      
      // Store token in localStorage with expiration (1 hour)
      const resetData = {
        email: email,
        token: resetToken,
        expires: Date.now() + 3600000 // 1 hour from now
      }
      localStorage.setItem('passwordReset', JSON.stringify(resetData))

      // Create reset link
      const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`

      // Send email using EmailJS
      const templateParams = {
        to_email: email,
        reset_link: resetLink,
        user_email: email
      }

      console.log('Sending email with params:', {
        service: EMAILJS_CONFIG.SERVICE_ID,
        template: EMAILJS_CONFIG.TEMPLATE_ID,
        to: email 
      })

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      )

      console.log('Email sent successfully:', response)
      setEmailSent(true)
      toast.success('Password reset link sent to your email!')
    } catch (error) {
      console.error('Error sending email:', error)
      
      // More detailed error message
      let errorMessage = 'Failed to send reset email. '
      
      if (error.text) {
        errorMessage += error.text
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += 'Please check your email configuration.'
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-beige to-royal-blue/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl fade-in">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Check Your Email
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              The link will expire in 1 hour.
            </p>
          </div>

          <div className="mt-6">
            <Link
              to="/login"
              className="w-full btn-primary flex items-center justify-center"
            >
              Back to Login
            </Link>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setEmailSent(false)
                setEmail('')
              }}
              className="text-sm font-medium text-primary hover:text-secondary"
            >
              Didn't receive the email? Resend
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-beige to-royal-blue/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl fade-in">
        
        {/* Header */}
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Forgot Password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="you@example.com"
              />
            </div>
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
                'Send Reset Link'
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

        {/* Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            💡 Remember your password? <Link to="/login" className="text-primary hover:text-secondary">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
