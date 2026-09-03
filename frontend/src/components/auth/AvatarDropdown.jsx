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
        className="flex items-center gap-2 rounded-full border-2 border-stone bg-paper p-1 transition-transform hover:-translate-y-0.5 hover:bg-blush"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blush font-extrabold text-ink" aria-hidden="true">
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-[100] mt-2 w-52 rounded-soft border-2 border-stone bg-paper club-shadow"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          <div className="border-b-2 border-stone px-4 py-3">
            <p className="font-extrabold text-ink">{user.displayName}</p>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
          <div className="py-1" role="none">
            <Link
              to="/profile"
              className="block px-4 py-2 text-sm font-semibold text-ink hover:bg-powder"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>
            <Link
              to="/settings"
              className="block px-4 py-2 text-sm font-semibold text-ink hover:bg-mint"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              Settings
            </Link>
            <Link
              to="/create"
              className="block px-4 py-2 text-sm font-semibold text-ink hover:bg-butter"
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
              className="block w-full px-4 py-2 text-left text-sm font-semibold text-ink hover:bg-blush"
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
