import { useAuth } from '../../contexts/AuthContext'
import { buttonClasses } from '../common/Button'

const LoginButton = ({ returnTo }) => {
  const { signInWithGoogle, loading } = useAuth()

  if (loading) {
    return (
      <button type="button" disabled className={buttonClasses()} aria-disabled="true">
        Loading...
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => signInWithGoogle(returnTo)}
      className={buttonClasses()}
      aria-label="Sign in with Google"
    >
      <svg className="h-5 w-5 rounded-full bg-paper p-0.5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.92-4.18 2.92-7.19Z" />
        <path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.35l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.5A9.74 9.74 0 0 0 12 21.7Z" />
        <path fill="#FBBC05" d="M6.54 13.81A5.85 5.85 0 0 1 6.23 12c0-.63.11-1.24.31-1.81v-2.5H3.3A9.73 9.73 0 0 0 2.27 12c0 1.57.38 3.06 1.03 4.31l3.24-2.5Z" />
        <path fill="#EA4335" d="M12 6.16c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.24 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.7 5.39l3.24 2.5c.77-2.31 2.92-4.03 5.46-4.03Z" />
      </svg>
      {/* Short label on phones so the header never wraps; the accessible
          name stays "Sign in with Google" via aria-label. */}
      <span className="sm:hidden">Sign in</span>
      <span className="hidden sm:inline">Sign in with Google</span>
    </button>
  )
}

export default LoginButton
