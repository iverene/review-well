import { create } from 'zustand'
import axios from 'axios'

// Shared unread-count state so the navigation badge updates the moment
// notifications are read anywhere — no refresh, no 20s wait. The badge
// poller still corrects drift in the background.
const useNotificationStore = create((set, get) => ({
  unreadCount: 0,

  setUnreadCount: (unreadCount) => set({ unreadCount }),

  refresh: async () => {
    try {
      const response = await axios.get('/api/social/notifications/unread-count', {
        withCredentials: true,
      })
      set({ unreadCount: response.data.count || 0 })
    } catch {
      // Badge keeps its last known count; the next poll retries.
    }
  },

  markOneRead: () => {
    set({ unreadCount: Math.max(0, get().unreadCount - 1) })
  },

  markAllRead: () => {
    set({ unreadCount: 0 })
  },

  bumpUnread: (n) => {
    if (n > 0) set({ unreadCount: get().unreadCount + n })
  },
}))

export default useNotificationStore
