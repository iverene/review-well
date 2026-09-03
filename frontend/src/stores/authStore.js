import { create } from 'zustand'

const guestStorageKey = 'review-well-guest'

const hasGuestSession = () => (
  typeof window !== 'undefined' && window.localStorage.getItem(guestStorageKey) === 'true'
)

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isGuest: hasGuestSession(),
  login: (user) => {
    window.localStorage.removeItem(guestStorageKey)
    set({ user, isAuthenticated: true, isGuest: false })
  },
  enterGuest: () => {
    window.localStorage.setItem(guestStorageKey, 'true')
    set({ user: null, isAuthenticated: false, isGuest: true })
  },
  logout: () => {
    window.localStorage.removeItem(guestStorageKey)
    set({ user: null, isAuthenticated: false, isGuest: false })
  },
}))

export default useAuthStore
