import { Link, useLocation } from 'react-router-dom'
import { Home, LibraryBig, Globe2, UserPlus, UserRound, Plus } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'

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
        <img src="/logo.png" alt="" className="h-10 w-10 object-contain" />
        <img src="/word-logo.png" alt="Review Well" className="ml-2 h-7 w-auto max-w-[150px] object-contain" />
      </Link>

      <nav className="space-y-2" aria-label="Primary navigation">
        {navItems.map(({ to, label, icon: Icon, active }) => (
          <Link
            key={to}
            to={to}
            className={`group relative flex min-h-12 items-center gap-3 overflow-hidden rounded-soft px-4 py-3 text-sm font-extrabold transition-all ${active ? 'border-2 border-accent bg-blush text-ink club-shadow before:absolute before:bottom-2 before:left-0 before:top-2 before:w-1 before:rounded-r-full before:bg-accent' : 'border-2 border-transparent text-muted hover:bg-powder hover:text-ink'}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active ? 'bg-accent text-paper' : 'bg-paper text-muted group-hover:bg-blush group-hover:text-ink'}`}>
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
        <Link
          to="/create"
          className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-soft border-2 px-4 py-3 text-sm font-extrabold transition-colors ${location.pathname === '/create' ? 'border-accent bg-accent text-paper' : 'border-stone bg-paper text-ink hover:border-powder hover:bg-powder'}`}
          aria-current={location.pathname === '/create' ? 'page' : undefined}
        >
          <Plus className="h-5 w-5" strokeWidth={2.8} aria-hidden="true" />
          <span>Create</span>
        </Link>
      </div>
    </aside>
  )
}

export default Sidebar
