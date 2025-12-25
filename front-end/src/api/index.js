import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Enable cookies for HTTPOnly tokens
})

// Handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the access token
        await api.post('/auth/refresh')
        
        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth endpoints
export const authAPI = {
  signup: (email, password, displayName) =>
    api.post('/auth/signup', { email, password, display_name: displayName }),
  
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  refreshToken: () =>
    api.post('/auth/refresh'),
  
  resetPassword: (email, newPassword) =>
    api.post('/auth/reset-password', { email, new_password: newPassword }),
  
  getCSRFToken: () =>
    api.get('/auth/csrf-token'),
}

// Call endpoints
export const callAPI = {
  getHistory: (limit = 50) =>
    api.get(`/calls/history?limit=${limit}`),
  
  startCall: (receiverId, callType = 'video') =>
    api.post('/calls/start', { receiver_id: receiverId, call_type: callType }),
  
  endCall: (callId) =>
    api.put(`/calls/${callId}/end`),
  
  deleteCall: (callId) =>
    api.delete(`/calls/${callId}`),
}

export default api