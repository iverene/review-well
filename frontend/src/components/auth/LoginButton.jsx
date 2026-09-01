import { useAuth } from '../../contexts/AuthContext'

const LoginButton = () => {
  const { signInWithGoogle, loading } = useAuth()

  if (loading) {
    return (
      <button
        disabled
        className="rounded border border-stone bg-paper px-4 py-2 text-ink opacity-50"
        aria-disabled="true"
      >
        Loading...
      </button>
    )
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="rounded border border-stone bg-ink px-4 py-2 text-paper transition-colors hover:bg-stone focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
      aria-label="Sign in with Google"
    >
      Sign in with Google
    </button>
  )
}

export default LoginButton
