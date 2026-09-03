import { useAuth } from '../contexts/AuthContext'
import ErrorAlert from './common/ErrorAlert'
import NavigationShell from './layout/NavigationShell'

function Layout({ children }) {
  const { error } = useAuth()

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
