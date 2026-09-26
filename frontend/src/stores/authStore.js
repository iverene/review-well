import { create } from 'zustand'

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
    set({ user, isAuthenticated: true, isGuest: false })
  },
  updateUser: (patch) => {
    set((state) => (state.user ? { user: { ...state.user, ...patch } } : state))
  },
  enterGuest: () => {
    writeGuestSession(true)
    set({ user: null, isAuthenticated: false, isGuest: true })
  },
  logout: () => {
    writeGuestSession(false)
    set({ user: null, isAuthenticated: false, isGuest: false })
  },
}))

export default useAuthStore
