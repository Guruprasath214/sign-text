import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import AboutUs from './components/AboutUs'
import ForgotPassword from './components/ForgotPassword'
import Home from './components/Home'
import HowItWorks from './components/HowItWorks'
import Login from './components/Login'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import ResetPassword from './components/ResetPassword'
import Signup from './components/Signup'
import Dashboard from './pages/Dashboard'
import useAuthStore from './store/authStore'

function App() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    // Initialize auth on app load (only once per session, survives HMR)
    const hasInitialized = sessionStorage.getItem('auth_initialized')
    
    if (!hasInitialized) {
      sessionStorage.setItem('auth_initialized', 'true')
      initialize()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes - Require Login */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 99999 }}
      />
    </div>
  )
}

export default App
