import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const AvatarDropdown = () => {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded border border-stone p-1 transition-colors hover:bg-stone focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper" aria-hidden="true">
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-48 rounded border border-stone bg-paper shadow-lg"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          <div className="border-b border-stone px-4 py-3">
            <p className="text-sm font-medium text-ink">{user.displayName}</p>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
          <div className="py-1" role="none">
            <Link
              to="/profile"
              className="block px-4 py-2 text-sm text-ink hover:bg-stone"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>
            <Link
              to="/settings"
              className="block px-4 py-2 text-sm text-ink hover:bg-stone"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              Settings
            </Link>
            <Link
              to="/create"
              className="block px-4 py-2 text-sm text-ink hover:bg-stone"
              role="menuitem"
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
              role="menuitem"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AvatarDropdown
