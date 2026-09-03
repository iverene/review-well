import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import useAuthStore from '../stores/authStore'
import { getApiErrorMessage } from '../utils/apiError'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user, isAuthenticated, isGuest, login, enterGuest, logout } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setError(null)
      const response = await axios.get('/api/auth/me', { withCredentials: true })
      if (response.data.user) {
        login(response.data.user)
        return response.data.user
      }
      return false
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Failed to check authentication:', error)
        setError(getApiErrorMessage(error, 'Unable to check your session.'))
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = () => {
    window.location.href = '/api/auth/google'
  }

  const handleLogout = async () => {
    if (isGuest) {
      logout()
      return
    }

    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true })
      logout()
    } catch (error) {
      console.error('Logout error:', error)
      setError(getApiErrorMessage(error, 'Unable to sign out. Please try again.'))
    }
  }

  const value = {
    user,
    isAuthenticated,
    isGuest,
    loading,
    error,
    signInWithGoogle,
    continueAsGuest: enterGuest,
    logout: handleLogout,
    refreshUser: checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
