import { create } from 'zustand'

import useQueryCache from './queryCache'

const guestStorageKey = 'review-well-guest'

// Storage can throw (private mode, disabled cookies) — never let auth boot
// or transitions crash; fall back to memory-only guest state.
const readGuestSession = () => {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(guestStorageKey) === 'true'
  } catch {
    return false
  }
}

const writeGuestSession = (value) => {
  try {
    if (value) window.localStorage.setItem(guestStorageKey, 'true')
    else window.localStorage.removeItem(guestStorageKey)
  } catch {
    // Memory-only guest state for this visit.
  }
}

const hasGuestSession = () => readGuestSession()

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isGuest: hasGuestSession(),
  login: (user) => {
    writeGuestSession(false)
    const previous = useAuthStore.getState()
    if (!previous.isAuthenticated || previous.user?.id !== user?.id) {
      useQueryCache.getState().reset()
    }
    set({ user, isAuthenticated: true, isGuest: false })
  },
  updateUser: (patch) => {
    set((state) => (state.user ? { user: { ...state.user, ...patch } } : state))
  },
  enterGuest: () => {
    writeGuestSession(true)
    const previous = useAuthStore.getState()
    if (!previous.isGuest) {
      useQueryCache.getState().reset()
    }
    set({ user: null, isAuthenticated: false, isGuest: true })
  },
  logout: () => {
    writeGuestSession(false)
    useQueryCache.getState().reset()
    set({ user: null, isAuthenticated: false, isGuest: false })
  },
}))

export default useAuthStore
