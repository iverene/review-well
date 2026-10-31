import { Link, useLocation } from 'react-router-dom'
import { Home, LibraryBig, Globe2, UserPlus, UserRound } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'

const BottomDock = () => {
  const location = useLocation()
  const { user } = useAuth()

  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: (
        <Home className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
      ),
    },
    {
      to: '/reviewer/my',
      label: 'My Reviewers',
      icon: (
        <LibraryBig className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
      ),
    },
    {
      to: '/reviewer/public',
      label: 'Public Reviewers',
      icon: (
        <Globe2 className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
      ),
    },
    {
      to: '/friends',
      label: 'Friends',
      icon: (
        <UserPlus className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
      ),
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: (
        <UserRound className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
      ),
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-stone bg-paper/95 px-3 pb-[env(safe-area-inset-bottom)] shadow-[0_-3px_0_rgb(var(--ink)/0.06)] backdrop-blur">
      <nav className="flex w-full items-center justify-evenly gap-0 py-2" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
            || (item.to === '/reviewer/my' && location.pathname.startsWith('/reviewer/my'))
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              title={item.label}
              className={`flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-soft px-1 py-2 transition-colors duration-150 ${
                isActive
                  ? 'bg-blush text-accent'
                  : 'text-muted hover:bg-cream hover:text-ink'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label === 'Profile' && user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : item.icon}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default BottomDock
