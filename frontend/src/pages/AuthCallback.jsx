import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ErrorAlert from '../components/common/ErrorAlert'

const AuthCallback = () => {
  const { refreshUser, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleCallback = async () => {
      const authenticated = await refreshUser()
      if (authenticated) {
        navigate('/', { replace: true })
      } else {
        setError('We could not complete Google sign-in. Please try again.')
      }
    }

    if (!loading) {
      handleCallback()
    }
  }, [refreshUser, navigate, loading])

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="text-center">
        {error ? (
          <>
            <ErrorAlert>{error}</ErrorAlert>
            <button onClick={() => navigate('/login')} className="mt-4 text-sm font-bold text-ink hover:underline">
              Return to sign in
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 text-ink">Signing you in...</div>
            <div className="text-sm text-muted">Please wait while we complete your authentication.</div>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthCallback
