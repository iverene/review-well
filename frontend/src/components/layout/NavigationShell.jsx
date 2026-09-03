import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'
import BottomDock from './BottomDock'

const NavigationShell = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  return (
    <div className="flex h-screen bg-paper">
      {/* Desktop Sidebar */}
      {isAuthenticated && (
        <div className="hidden md:flex">
          <Sidebar open={false} onClose={() => {}} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Bar */}
        <header className={`flex items-center justify-between border-b border-stone px-4 py-3 md:px-6 ${isAuthenticated ? 'md:hidden' : ''}`}>
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center text-xl font-bold text-ink" aria-label="Review Well home">
              <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
              <img src="/word-logo.png" alt="Review Well" className="ml-2 h-6 w-auto object-contain" />
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            {!isAuthenticated && (
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
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">{children}</main>
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
