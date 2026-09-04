import { useLocation } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'

import ErrorAlert from './common/ErrorAlert'
import NavigationShell from './layout/NavigationShell'

function Layout({ children }) {
  const { error } = useAuth()
  const location = useLocation()
  const isWorkspace = location.pathname.startsWith('/workspace')

  // Fullscreen study-desk shell: no global chrome, full viewport, own scroll.
  if (isWorkspace) {
    return (
      <div className="workspace-shell" style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#F8F9FA' }}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-ink focus:text-paper">
          Skip to main content
        </a>
        <div id="main-content" role="main" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <NavigationShell>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-ink focus:text-paper">
        Skip to main content
      </a>
      <ErrorAlert className="mx-auto mt-4 max-w-6xl px-4 md:px-8">{error}</ErrorAlert>
      <div id="main-content" className="mx-auto max-w-6xl px-4 py-8 md:px-8" role="main">
        {children}
      </div>
    </NavigationShell>
  )
}

export default Layout
