import { Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuthStore from '../store/authStore'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    toast.warning('Please login to access video calls')
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
