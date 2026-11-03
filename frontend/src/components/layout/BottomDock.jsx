import { Link, useLocation } from 'react-router-dom'
import { Home, LibraryBig, Globe2, UserPlus, UserRound } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, match: (path) => path === '/' },
  { to: '/reviewer/my', label: 'My Reviewers', icon: LibraryBig, match: (path) => path.startsWith('/reviewer/my') },
  { to: '/reviewer/public', label: 'Public', icon: Globe2, match: (path) => path === '/reviewer/public' },
  { to: '/friends', label: 'Friends', icon: UserPlus, match: (path) => path.startsWith('/friends') },
  { to: '/profile', label: 'Profile', icon: UserRound, match: (path) => path.startsWith('/profile') },
]

// Floating pill dock (Soft Pop): the active destination expands into a
// Berry pill (with its label from `sm` up, so the dock fits a 360 px phone);
// the rest stay as icons with accessible names.
const BottomDock = () => {
  const { pathname } = useLocation()
  const { user } = useAuth()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <nav
        aria-label="Primary navigation"
        className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-stone bg-paper/95 p-2 shadow-float backdrop-blur"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname)
          const avatar = label === 'Profile' && user?.avatarUrl
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              title={label}
              aria-current={active ? 'page' : undefined}
              className={`flex h-12 items-center justify-center gap-2 rounded-full transition-[background-color,color,padding] duration-200 ease-out-soft ${active ? 'w-16 bg-accent text-paper shadow-soft-sm sm:w-auto sm:px-5' : 'w-12 text-muted hover:bg-cream hover:text-ink'}`}
            >
              {avatar ? (
                <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <Icon className="h-6 w-6 shrink-0" strokeWidth={2.1} aria-hidden="true" />
              )}
              {active && <span className="hidden whitespace-nowrap text-base font-bold sm:inline">{label}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default BottomDock
