import { useState, useEffect } from 'react'
import axios from 'axios'
import NotificationItem from '../components/notifications/NotificationItem'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchNotifications()
  }, [page])

  const fetchNotifications = async () => {
    try {
      setError(null)
      const response = await axios.get('/api/social/notifications', {
        params: { page, limit: 20 },
        withCredentials: true,
      })
      setNotifications((prev) =>
        page === 1
          ? response.data.notifications
          : [...prev, ...response.data.notifications]
      )
      setHasMore(response.data.notifications.length === 20)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setError(getApiErrorMessage(error, 'Unable to load notifications.'))
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (notificationId) => {
    try {
      await axios.put(`/api/social/notifications/${notificationId}/read`, {}, {
        withCredentials: true,
      })
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      setError(getApiErrorMessage(error, 'Unable to mark the notification as read.'))
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/social/notifications/read-all', {}, {
        withCredentials: true,
      })
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      )
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      setError(getApiErrorMessage(error, 'Unable to mark notifications as read.'))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-muted">Loading notifications...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">Notifications</h1>
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-muted hover:text-ink"
            >
              Mark all as read
            </button>
          )}
        </div>

        <ErrorAlert className="mb-4">{error}</ErrorAlert>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-muted">
            <svg
              className="mx-auto h-12 w-12 text-stone"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="mt-4">No notifications yet</p>
          </div>
        ) : (
          <div className="rounded border border-stone bg-paper">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && notifications.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-stone px-4 py-2 text-sm text-ink hover:bg-stone"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
