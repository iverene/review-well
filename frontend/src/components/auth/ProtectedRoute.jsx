import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isProfileComplete } from '../../utils/profile'

const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-ink">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!['/settings', '/onboarding'].includes(location.pathname) && !isProfileComplete(user)) {
    return <Navigate to="/settings" state={{ onboarding: true }} replace />
  }

  return children
}

export default ProtectedRoute
