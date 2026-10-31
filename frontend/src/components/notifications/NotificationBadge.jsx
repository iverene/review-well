import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import useNotificationStore from '../../stores/notificationStore'

const NotificationBadge = () => {
  const { isAuthenticated } = useAuth()
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const refresh = useNotificationStore((state) => state.refresh)

  useEffect(() => {
    if (!isAuthenticated) return
    refresh()
    // Live delivery without page restarts: poll plus refresh on window focus.
    // Background tabs skip polls and catch up as soon as they are visible.
    const refreshIfVisible = () => {
      if (!document.hidden) refresh()
    }
    const interval = setInterval(refreshIfVisible, 20000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refreshIfVisible)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [isAuthenticated, refresh])

  if (!isAuthenticated) return null

  return (
    <Link
      to="/notifications"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors duration-150 hover:bg-butter"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-page bg-accent px-1 text-xs font-bold text-paper" aria-hidden="true">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

export default NotificationBadge
