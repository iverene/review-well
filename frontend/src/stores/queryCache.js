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

// In-flight promises by key so simultaneous mounts share one network call.
// Module scope (not store state) so it never triggers rerenders.
// Generation guards against stale writes: if reset() runs while a fetch is
// in flight, the late response resolves to its caller but must not repopulate
// the cleared cache (see "reset clears entries and in-flight dedup" test).
const inflight = new Map()
let generation = 0

const useQueryCache = create((set, get) => ({
  entries: {},

  getEntry: (key) => get().entries[key] || null,

  setEntry: (key, data) =>
    set((state) => ({
      entries: { ...state.entries, [key]: { data, fetchedAt: Date.now() } },
    })),

  invalidate: (prefix) =>
    set((state) => ({
      entries: Object.fromEntries(
        Object.entries(state.entries).filter(([key]) => !key.startsWith(prefix))
      ),
    })),

  reset: () => {
    generation += 1
    inflight.clear()
    set({ entries: {} })
  },
}))

// Cache-first fetch shared by the hook and imperative callers. Resolves with
// response.data. force skips both the entry and the dedup map.
const fetchShared = (key, fetcher, { force = false } = {}) => {
  const { entries } = useQueryCache.getState()
  if (!force && entries[key]) return Promise.resolve(entries[key].data)
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
export { cacheKey, fetchShared }
