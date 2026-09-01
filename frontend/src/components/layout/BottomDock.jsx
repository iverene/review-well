import { Link, useLocation } from 'react-router-dom'

const BottomDock = () => {
  const location = useLocation()

  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/create',
      label: 'Create',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      elevated: true,
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-stone bg-paper">
      <nav className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center gap-1 px-4 py-2 ${
              item.elevated
                ? 'rounded-full bg-ink text-paper'
                : location.pathname === item.to
                ? 'text-ink'
                : 'text-muted'
            }`}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default BottomDock
