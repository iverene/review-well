import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'
import BottomDock from './BottomDock'
import NotificationBadge from '../notifications/NotificationBadge'
import AvatarDropdown from '../auth/AvatarDropdown'
import LoginButton from '../auth/LoginButton'

const NavigationShell = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const isWorkspace = location.pathname.startsWith('/workspace')

  // Defensive: never render global chrome inside the fullscreen study desk.
  if (isWorkspace) {
    return (
      <div className="workspace-shell" style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#F8F9FA' }}>
        {children}
      </div>
    )
  }

  return (
    <div className="relative flex h-screen bg-paper">
      {/* Desktop Sidebar */}
      {isAuthenticated && (
        <div className="hidden md:flex">
          <Sidebar open={false} onClose={() => {}} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-32 bg-gradient-to-b from-white/90 via-white/45 to-transparent md:hidden" aria-hidden="true" />

        {/* Header Bar */}
        <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between border-b-0 bg-transparent px-4 py-3 md:px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className={`flex min-w-0 items-center text-xl font-bold text-ink ${isAuthenticated ? 'md:hidden' : ''}`} aria-label="Review Well home">
              <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
              <img src="/word-logo.png" alt="Review Well" className="ml-2 h-6 w-auto max-w-[130px] object-contain sm:max-w-none" />
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <NotificationBadge />
                <AvatarDropdown />
              </div>
            ) : (
              <LoginButton />
            )}
          </nav>
        </header>

        {/* Page Content */}
        <main className="relative flex-1 overflow-y-auto pb-24 pt-20 md:pb-0 md:pt-24">{children}</main>
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
