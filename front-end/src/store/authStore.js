import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../api'
import socketService from '../services/socket'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Actions
      login: async (email, password) => {
        set({ loading: true, error: null })
        
        try {
          const response = await authAPI.login(email, password)
          const { user } = response.data
          
          // No need to store token - it's in HTTPOnly cookie
          // Just store user info
          set({ 
            user: { ...user, uid: user._id || user.id, displayName: user.display_name },
            isAuthenticated: true,
            loading: false 
          })
          
          // Connect to socket
          socketService.connect(user._id || user.id)
          
          return { success: true }
        } catch (error) {
          const errorMsg = error.response?.data?.error || 'Login failed'
          set({ loading: false, error: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      signup: async (email, password, confirmPassword) => {
        set({ loading: true, error: null })
        
        try {
          if (password !== confirmPassword) {
            set({ loading: false, error: 'Passwords do not match' })
            return { success: false, error: 'Passwords do not match' }
          }

          const displayName = email.split('@')[0]
          const response = await authAPI.signup(email, password, displayName)
          const { user } = response.data
          
          // No need to store token - it's in HTTPOnly cookie
          set({ 
            user: { ...user, uid: user._id || user.id, displayName: user.display_name },
            isAuthenticated: true,
            loading: false 
          })
          
          // Connect to socket
          socketService.connect(user._id || user.id)
          
          return { success: true }
        } catch (error) {
          const errorMsg = error.response?.data?.error || error.response?.data?.details?.[0] || 'Signup failed'
          set({ loading: false, error: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      logout: async () => {
        try {
          // Call logout endpoint to clear HTTPOnly cookies
          await authAPI.logout()
        } catch (error) {
          console.error('Logout error:', error)
        }
        
        // Disconnect socket
        socketService.disconnect()
        
        // Clear storage
        localStorage.removeItem('user')
        
        set({ 
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null
        })
      },

      // Check if user is logged in
      checkAuth: () => {
        const { user } = get()
        return !!user
      },

      // Initialize auth from storage
      initialize: async () => {
        try {
          const response = await authAPI.getCurrentUser()
          const user = response.data.user
          
          set({ 
            user: { ...user, uid: user._id || user.id, displayName: user.display_name },
            isAuthenticated: true 
          })
          
          // Connect to socket
          socketService.connect(user._id || user.id)
        } catch (error) {
          // Silently handle no session (don't log errors to avoid console spam)
          if (error.response?.status !== 429) {
            localStorage.removeItem('user')
            set({ user: null, token: null, isAuthenticated: false })
          }
        }
      },

      // Reset password
      resetPassword: async (email, newPassword) => {
        set({ loading: true, error: null })
        
        try {
          await authAPI.resetPassword(email, newPassword)
          set({ loading: false })
          return { success: true }
        } catch (error) {
          const errorMsg = error.response?.data?.error || 'Failed to reset password'
          set({ loading: false, error: errorMsg })
          return { success: false, error: errorMsg }
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name)
          return value ? JSON.parse(value) : null
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        },
      },
    }
  )
)

export default useAuthStore
