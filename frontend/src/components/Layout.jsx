import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginButton from './auth/LoginButton'
import AvatarDropdown from './auth/AvatarDropdown'
import NotificationBadge from './notifications/NotificationBadge'

function Layout({ children }) {
  const { isAuthenticated, isGuest, loading, signInWithGoogle, logout } = useAuth()

  return (
    <div className="min-h-screen bg-paper">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-ink focus:text-paper">
        Skip to main content
      </a>
      <header className="border-b border-stone px-6 py-4" role="banner">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">
            <Link to="/" aria-label="Review Well home">Review Well</Link>
          </h1>
          <nav className="flex items-center gap-4" role="navigation" aria-label="Main navigation">
            {loading ? (
              <div className="text-sm text-muted" aria-live="polite">Loading...</div>
            ) : isAuthenticated ? (
              <>
                <Link
                  to="/create"
                  className="rounded border border-stone px-4 py-2 text-sm text-ink transition-colors hover:bg-stone focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
                >
                  Create
                </Link>
                <NotificationBadge />
                <AvatarDropdown />
              </>
            ) : isGuest ? (
              <>
                <span className="text-sm text-muted">Guest · View only</span>
                <button
                  onClick={signInWithGoogle}
                  className="rounded border border-stone px-4 py-2 text-sm text-ink transition-colors hover:bg-stone focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
                >
                  Sign in with Google
                </button>
              </>
            ) : (
              <LoginButton />
            )}
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-4xl px-6 py-8" role="main">
        {children}
      </main>
    </div>
  )
}

export default Layout
