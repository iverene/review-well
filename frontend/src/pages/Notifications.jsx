import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { CheckCheck } from 'lucide-react'

import NotificationItem from '../components/notifications/NotificationItem'
import PageHeader from '../components/common/PageHeader'
import PageContainer from '../components/common/PageContainer'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import { getApiErrorMessage } from '../utils/apiError'
import { useToast } from '../contexts/ToastContext'
import useNotificationStore from '../stores/notificationStore'
import { NotificationsSkeleton } from '../components/common/Skeleton'

const appendUnique = (previous, incoming) => {
  const known = new Set(previous.map((notification) => notification.id))
  return [...previous, ...incoming.filter((notification) => !known.has(notification.id))]
}

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const toast = useToast()
  const bumpUnread = useNotificationStore((state) => state.bumpUnread)
  const markOneRead = useNotificationStore((state) => state.markOneRead)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  // Refreshes compare against the loaded list, so they wait for page 1;
  // before that every notification would look new and be counted twice.
  const loadedRef = useRef(false)

  useEffect(() => {
    fetchNotifications()
  }, [page])

  // Live delivery without page restarts: silently merge newly arrived
  // notifications to the top of the list, on an interval and on focus —
  // and toast once per batch so arrivals surface above the fold.
  useEffect(() => {
    const fetchLatest = async () => {
      if (!loadedRef.current) return
      try {
        const response = await axios.get('/api/social/notifications', {
          params: { page: 1, limit: 20 },
          withCredentials: true,
        })
        const fresh = response.data.notifications || []
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
    // Background tabs skip polls; the focus listener catches up on return.
    const interval = setInterval(() => {
      if (!document.hidden) fetchLatest()
    }, 20000)
    window.addEventListener('focus', fetchLatest)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', fetchLatest)
    }
  }, [toast])

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/social/notifications', {
        params: { page, limit: 20 },
        withCredentials: true,
      })
      const fresh = response.data.notifications || []
      setNotifications((prev) =>
        page === 1 ? fresh : appendUnique(prev, fresh)
      )
      loadedRef.current = true
      const total = Number(response.data.total)
      setHasMore(
        Number.isFinite(total)
          ? page * 20 < total
          : fresh.length === 20
      )
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast.error(getApiErrorMessage(error, 'Unable to load notifications.'))
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
      toast.error(getApiErrorMessage(error, 'Unable to mark the notification as read.'))
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
      toast.error(getApiErrorMessage(error, 'Unable to mark notifications as read.'))
    }
  }

  if (loading) {
    return (
      <NotificationsSkeleton />
    )
  }

  return (
    <PageContainer className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <PageHeader title="Notifications" />
        {notifications.some((n) => !n.isRead) && (
          <Button variant="quiet" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4" aria-hidden="true" /> Mark All as Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No Notifications Yet">
          Follows, saves, and new reviewers from people you follow will show up here.
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}

      {hasMore && notifications.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Button onClick={() => setPage((p) => p + 1)}>Load More</Button>
        </div>
      )}
    </PageContainer>
  )
}

export default Notifications
