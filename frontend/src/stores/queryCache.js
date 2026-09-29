import { create } from 'zustand'

// Key format: "GET /api/reviewers/public?limit=50". Params sort so
// identical requests built in different order share one entry.
const cacheKey = (method, url, params = {}) => {
  const sorted = Object.keys(params)
    .sort()
    .map((name) => `${name}=${params[name] ?? ''}`)
    .join('&')
  return `${String(method).toUpperCase()} ${url}${sorted ? `?${sorted}` : ''}`
}

// Persistence across browser-driven tab reloads (mobile browsers discard
// background tabs after minutes in recents; the reboot wipes memory).
// sessionStorage survives reloads in the same tab but dies with it — no
// cross-day staleness, no shared-device leakage. Entries older than the TTL
// are dropped on restore; the hooks revalidate whatever survives.
const PERSIST_KEY = 'review-well-query-cache'
const PERSIST_VERSION = 1
const PERSIST_TTL_MS = 30 * 60 * 1000
const PERSIST_MAX_BYTES = 2 * 1024 * 1024

const loadPersistedEntries = () => {
  try {
    const raw = window.sessionStorage.getItem(PERSIST_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed?.version !== PERSIST_VERSION || !parsed?.entries) return {}
    const now = Date.now()
    return Object.fromEntries(
      Object.entries(parsed.entries).filter(([, entry]) => entry && now - entry.fetchedAt < PERSIST_TTL_MS)
    )
  } catch {
    return {}
  }
}

const persistEntries = (entries) => {
  try {
    const payload = JSON.stringify({ version: PERSIST_VERSION, entries })
    if (payload.length > PERSIST_MAX_BYTES) return
    window.sessionStorage.setItem(PERSIST_KEY, payload)
  } catch {
    // Quota or blocked storage — the memory cache keeps working alone.
  }
}
// In-flight promises by key so simultaneous mounts share one network call.
// Module scope (not store state) so it never triggers rerenders.
// Generation guards against stale writes: if reset() runs while a fetch is
// in flight, the late response resolves to its caller but must not repopulate
// the cleared cache (see "reset clears entries and in-flight dedup" test).
const inflight = new Map()
let generation = 0

const useQueryCache = create((set, get) => ({
  entries: loadPersistedEntries(),

  getEntry: (key) => get().entries[key] || null,

  setEntry: (key, data) => {
    set((state) => ({
      entries: { ...state.entries, [key]: { data, fetchedAt: Date.now() } },
    }))
    persistEntries(get().entries)
  },

  invalidate: (prefix) => {
    set((state) => ({
      entries: Object.fromEntries(
        Object.entries(state.entries).filter(([key]) => !key.startsWith(prefix))
      ),
    }))
    persistEntries(get().entries)
  },

  reset: () => {
    generation += 1
    inflight.clear()
    try {
      window.sessionStorage.removeItem(PERSIST_KEY)
    } catch {
      // Storage already unavailable — memory entries clear below regardless.
    }
    set({ entries: {} })
  },
}))

// Cache-first fetch shared by the hook and imperative callers. Resolves with
// response.data. force skips both the entry and the dedup map (explicit
// user-initiated refresh). revalidate skips the entry but still dedups, so
// every mount's background refresh shares one network call.
const fetchShared = (key, fetcher, { force = false, revalidate = false } = {}) => {
  const { entries } = useQueryCache.getState()
  if (!force && !revalidate && entries[key]) return Promise.resolve(entries[key].data)
  if (!force && inflight.has(key)) return inflight.get(key)
  const promise = (async () => {
    const seen = generation
    try {
      const response = await fetcher()
      if (seen === generation) useQueryCache.getState().setEntry(key, response.data)
      return response.data
    } finally {
      if (inflight.get(key) === promise) inflight.delete(key)
    }
  })()
  if (!force) inflight.set(key, promise)
  return promise
}

export default useQueryCache
export { cacheKey, fetchShared, loadPersistedEntries, PERSIST_KEY }
