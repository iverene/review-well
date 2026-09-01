import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const AvatarDropdown = () => {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded border border-stone p-1 transition-colors hover:bg-stone"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper">
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-48 rounded border border-stone bg-paper shadow-lg">
            <div className="border-b border-stone px-4 py-3">
              <p className="text-sm font-medium text-ink">{user.displayName}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
            <div className="py-1">
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-ink hover:bg-stone"
                onClick={() => setIsOpen(false)}
              >
                Profile
              </Link>
              <Link
                to="/create"
                className="block px-4 py-2 text-sm text-ink hover:bg-stone"
                onClick={() => setIsOpen(false)}
              >
                Create Reviewer
              </Link>
              <button
                onClick={() => {
                  logout()
                  setIsOpen(false)
                }}
                className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-stone"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AvatarDropdown
