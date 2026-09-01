import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const AuthCallback = () => {
  const { refreshUser, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      await refreshUser()
      navigate('/', { replace: true })
    }

    if (!loading) {
      handleCallback()
    }
  }, [refreshUser, navigate, loading])

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="text-center">
        <div className="mb-4 text-ink">Signing you in...</div>
        <div className="text-sm text-muted">Please wait while we complete your authentication.</div>
      </div>
    </div>
  )
}

export default AuthCallback
