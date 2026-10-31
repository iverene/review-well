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
    // Keeps entries restored after a tab reload when they are this user's.
    useQueryCache.getState().claim(user?.id ?? null)
    set({ user, isAuthenticated: true, isGuest: false })
  },
  updateUser: (patch) => {
    set((state) => (state.user ? { user: { ...state.user, ...patch } } : state))
  },
  enterGuest: () => {
    writeGuestSession(true)
    useQueryCache.getState().claim('guest')
    set({ user: null, isAuthenticated: false, isGuest: true })
  },
  logout: () => {
    writeGuestSession(false)
    useQueryCache.getState().reset()
    set({ user: null, isAuthenticated: false, isGuest: false })
  },
  // The session check found no signed-in user (e.g. an expired cookie):
  // drop anything a previous user cached, but keep a guest's own entries.
  resolveAnonymous: () => {
    useQueryCache.getState().claim(useAuthStore.getState().isGuest ? 'guest' : null)
  },
}))

export default useAuthStore
