import { useState, useEffect } from 'react'
import axios from 'axios'

import NotificationItem from '../components/notifications/NotificationItem'
import ErrorAlert from '../components/common/ErrorAlert'
import PageHeader from '../components/common/PageHeader'
import PageContainer from '../components/common/PageContainer'
import { getApiErrorMessage } from '../utils/apiError'
import { useToast } from '../contexts/ToastContext'
import useNotificationStore from '../stores/notificationStore'
import { NotificationsSkeleton } from '../components/common/Skeleton'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  const toast = useToast()
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount)
  const bumpUnread = useNotificationStore((state) => state.bumpUnread)
  const markOneRead = useNotificationStore((state) => state.markOneRead)
  const markAllRead = useNotificationStore((state) => state.markAllRead)

  useEffect(() => {
    fetchNotifications()
  }, [page])

  // Live delivery without page restarts: silently merge newly arrived
  // notifications to the top of the list, on an interval and on focus —
  // and toast once per batch so arrivals surface above the fold.
  useEffect(() => {
    let firstRun = true
    const fetchLatest = async () => {
      try {
        const response = await axios.get('/api/social/notifications', {
          params: { page: 1, limit: 20 },
          withCredentials: true,
        })
        const fresh = response.data.notifications || []
        if (firstRun) {
          firstRun = false
          setNotifications((prev) => {
            const known = new Set(prev.map((n) => n.id))
            const unseen = fresh.filter((n) => !known.has(n.id))
            return unseen.length > 0 ? [...unseen, ...prev] : prev
          })
          return
        }
        setNotifications((prev) => {
          const known = new Set(prev.map((n) => n.id))
          const unseen = fresh.filter((n) => !known.has(n.id))
          if (unseen.length > 0) {
            bumpUnread(unseen.filter((n) => !n.isRead).length)
            toast.info(unseen.length === 1 ? 'You Have 1 New Notification' : `You Have ${unseen.length} New Notifications`)
            return [...unseen, ...prev]
          }
          return prev
        })
      } catch {
        // Keep the stale list; the badge poll still surfaces the count
      }
    }
    const interval = setInterval(fetchLatest, 20000)
    window.addEventListener('focus', fetchLatest)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', fetchLatest)
    }
  }, [toast])

  const fetchNotifications = async () => {
    try {
      setError(null)
      const response = await axios.get('/api/social/notifications', {
        params: { page, limit: 20 },
        withCredentials: true,
      })
      const fresh = response.data.notifications || []
      setNotifications((prev) =>
        page === 1 ? fresh : [...prev, ...fresh]
      )
      setUnreadCount(fresh.filter((n) => !n.isRead).length)
      setHasMore(fresh.length === 20)
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
      markOneRead()
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
      markAllRead()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      setError(getApiErrorMessage(error, 'Unable to mark notifications as read.'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper"><NotificationsSkeleton /></div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <PageContainer>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <PageHeader title="Notifications" />
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="shrink-0 text-sm text-muted hover:text-ink"
            >
              Mark All as Read
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
            <p className="mt-4">No Notifications Yet</p>
          </div>
        ) : (
          <div>
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
              Load More
            </button>
          </div>
        )}
      </PageContainer>
    </div>
  )
}

export default Notifications
