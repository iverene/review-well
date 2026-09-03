import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginButton from './auth/LoginButton'
import AvatarDropdown from './auth/AvatarDropdown'
import NotificationBadge from './notifications/NotificationBadge'
import ErrorAlert from './common/ErrorAlert'

function Layout({ children }) {
  const { isAuthenticated, isGuest, loading, error, signInWithGoogle, logout } = useAuth()

  return (
    <div className="min-h-screen bg-paper">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-ink focus:text-paper">
        Skip to main content
      </a>
      <header className="relative z-50 border-b-2 border-stone bg-paper/90 px-4 py-3 backdrop-blur md:px-8" role="banner">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="flex items-center text-2xl font-bold text-ink">
            <Link to="/" aria-label="Review Well home" className="flex items-center">
              <img src="/logo.png" alt="" className="h-10 w-10 object-contain" />
              <img src="/word-logo.png" alt="Review Well" className="ml-2 h-7 w-auto max-w-[180px] object-contain sm:max-w-none" />
            </Link>
          </h1>
          <nav className="flex items-center gap-2 sm:gap-4" role="navigation" aria-label="Main navigation">
            {loading ? (
              <div className="text-sm font-semibold text-muted" aria-live="polite">Warming up...</div>
            ) : isAuthenticated ? (
              <>
                <Link
                  to="/create"
                  className="rounded-soft border-2 border-stone bg-mint px-4 py-2 text-sm font-bold text-ink transition-transform hover:-translate-y-0.5 hover:bg-mint"
                >
                  Create
                </Link>
                <NotificationBadge />
                <AvatarDropdown />
              </>
            ) : isGuest ? (
              <>
                <span className="hidden rounded-full bg-powder px-3 py-1 text-xs font-extrabold text-ink sm:inline">Guest · View only</span>
                <button
                  onClick={signInWithGoogle}
                  className="rounded-soft border-2 border-stone bg-paper px-3 py-2 text-xs font-extrabold text-ink transition-transform hover:-translate-y-0.5 hover:bg-powder sm:px-4 sm:text-sm"
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
      <ErrorAlert className="mx-auto mt-4 max-w-6xl px-4 md:px-8">{error}</ErrorAlert>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 md:px-8" role="main">
        {children}
      </main>
    </div>
  )
}

export default Layout
