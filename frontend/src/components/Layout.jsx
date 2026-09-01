import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginButton from './auth/LoginButton'
import AvatarDropdown from './auth/AvatarDropdown'

function Layout({ children }) {
  const { isAuthenticated, loading } = useAuth()

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-stone px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">
            <Link to="/">Review Well</Link>
          </h1>
          <nav className="flex items-center gap-4">
            {loading ? (
              <div className="text-sm text-muted">Loading...</div>
            ) : isAuthenticated ? (
              <>
                <Link
                  to="/create"
                  className="rounded border border-stone px-4 py-2 text-sm text-ink transition-colors hover:bg-stone"
                >
                  Create
                </Link>
                <AvatarDropdown />
              </>
            ) : (
              <LoginButton />
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  )
}

export default Layout
