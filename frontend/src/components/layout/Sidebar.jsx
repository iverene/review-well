import { Link, useLocation } from 'react-router-dom'
import { Home, LibraryBig, Globe2, UserPlus, UserRound, Plus } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import Button from '../common/Button'

const Sidebar = () => {
  const location = useLocation()
  const { user } = useAuth()

  const navItems = [
    { to: '/', label: 'Home', icon: Home, active: location.pathname === '/' },
    { to: '/reviewer/my', label: 'My Reviewers', icon: LibraryBig, active: location.pathname.startsWith('/reviewer/my') },
    { to: '/reviewer/public', label: 'Public Reviewers', icon: Globe2, active: location.pathname === '/reviewer/public' },
    { to: '/friends', label: 'Find Friends', icon: UserPlus, active: location.pathname.startsWith('/friends') },
    { to: '/profile', label: 'Profile', icon: UserRound, active: location.pathname.startsWith('/profile') },
  ]

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r-2 border-stone bg-paper px-4 py-5" aria-label="Sidebar navigation">
      <Link to="/" className="mb-10 flex items-center px-2" aria-label="Review Well home">
        <img src="/logo.webp" alt="" className="h-10 w-10 object-contain" />
        <img src="/word-logo.webp" alt="Review Well" width="430" height="112" className="wordmark ml-2 h-7 w-auto max-w-[150px] object-contain" />
      </Link>

      <nav className="space-y-2" aria-label="Primary navigation">
        {navItems.map(({ to, label, icon: Icon, active }) => (
          <Link
            key={to}
            to={to}
            className={`group relative flex min-h-11 items-center gap-3 rounded-soft border-2 px-3 py-2 text-sm font-extrabold transition-colors duration-150 ${active ? 'border-stone bg-blush text-ink shadow-sticker-sm' : 'border-transparent text-muted hover:bg-cream hover:text-ink'}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active ? 'bg-paper text-accent' : 'text-muted group-hover:text-ink'}`}>
              {label === 'Profile' && user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <Icon className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
              )}
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t-2 border-stone pt-5">
        <Button
          to="/create"
          variant="primary"
          size="lg"
          block
          aria-current={location.pathname === '/create' ? 'page' : undefined}
        >
          <Plus className="h-5 w-5" strokeWidth={2.8} aria-hidden="true" />
          <span>New Reviewer</span>
        </Button>
      </div>
    </aside>
  )
}

export default Sidebar
