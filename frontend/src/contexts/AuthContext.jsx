import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import useAuthStore from '../stores/authStore'

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
  const { user, isAuthenticated, isGuest, login, enterGuest, logout } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me', { withCredentials: true })
      if (response.data.user) {
        login(response.data.user)
      }
    } catch (error) {
      console.log('Not authenticated')
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
    }
  }

  const value = {
    user,
    isAuthenticated,
    isGuest,
    loading,
    signInWithGoogle,
    continueAsGuest: enterGuest,
    logout: handleLogout,
    refreshUser: checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
