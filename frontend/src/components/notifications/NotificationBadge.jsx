import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'

const NotificationBadge = () => {
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 30000) // Poll every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/social/notifications/unread-count', {
        withCredentials: true,
      })
      setUnreadCount(response.data.count)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  if (!isAuthenticated) return null

  return (
    <Link
      to="/notifications"
      className="relative rounded-full p-2 text-ink hover:bg-butter"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-paper">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

export default NotificationBadge
