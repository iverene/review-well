import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'
import BottomDock from './BottomDock'

const NavigationShell = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  return (
    <div className="flex h-screen bg-paper">
      {/* Desktop Sidebar */}
      {isAuthenticated && (
        <div className="hidden md:flex">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="flex items-center justify-between border-b border-stone px-4 py-3 md:px-6">
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded p-2 text-ink hover:bg-stone md:hidden"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <Link to="/" className="flex items-center text-xl font-bold text-ink" aria-label="Review Well home">
              <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
              <img src="/word-logo.png" alt="Review Well" className="ml-2 h-6 w-auto object-contain" />
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/create"
                  className="hidden rounded border border-stone px-4 py-2 text-sm text-ink transition-colors hover:bg-stone md:block"
                >
                  Create
                </Link>
                <Link to="/profile" className="rounded p-2 text-ink hover:bg-stone">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded border border-stone bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-stone"
              >
                Sign In
              </Link>
            )}
          </nav>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Bottom Dock */}
      {isAuthenticated && (
        <div className="md:hidden">
          <BottomDock />
        </div>
      )}
    </div>
  )
}

export default NavigationShell
