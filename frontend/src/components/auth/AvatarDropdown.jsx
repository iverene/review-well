import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { UserRound, Settings, Info, Mail, LogOut } from 'lucide-react'

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
          className="absolute right-0 z-[100] mt-2 w-64 rounded-soft border-2 border-stone bg-paper club-shadow"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          <div className="border-b-2 border-stone px-4 py-3">
            <p className="truncate whitespace-nowrap font-extrabold text-ink" title={user.displayName}>{user.displayName}</p>
          </div>
          <div className="p-1" role="none">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-powder"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <UserRound className="h-4 w-4 text-muted" aria-hidden="true" />
              Profile
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-mint"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4 text-muted" aria-hidden="true" />
              Setting
            </Link>
            <Link
              to="/about"
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-butter"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <Info className="h-4 w-4 text-muted" aria-hidden="true" />
              About
            </Link>
            <Link
              to="/contact"
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-powder"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <Mail className="h-4 w-4 text-muted" aria-hidden="true" />
              Contact
            </Link>
          </div>
          <div className="border-t-2 border-stone p-2">
            <button
              onClick={() => {
                logout()
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-3 rounded-soft px-3 py-2.5 text-left text-sm font-extrabold text-accent hover:bg-blush"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AvatarDropdown
