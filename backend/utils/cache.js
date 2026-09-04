// Tiny in-memory TTL cache so hot reads don't hit Postgres on every request.
// Correctness comes from short TTLs plus explicit invalidation on writes:
//   - `reviewers:` namespace covers reviewer lists, counts, and detail views
//   - `profile:` namespace covers profiles and user search
//   - `social:` namespace covers follower lists, follow counts, and saves
// Mutations bust their whole namespace (cheap refetch, never stale writes).

const store = new Map()

const TTL_30_SECONDS = 30 * 1000
const TTL_60_SECONDS = 60 * 1000
const MAX_ENTRIES = 1000

const get = (key) => {
  const entry = store.get(key)
  if (!entry) return undefined
  if (entry.expiresAt <= Date.now()) {
    store.delete(key)
    return undefined
  }
  return entry.value
}

const set = (key, value, ttlMs = TTL_60_SECONDS) => {
  if (store.size >= MAX_ENTRIES && !store.has(key)) {
    store.delete(store.keys().next().value)
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
  return value
}

const del = (key) => store.delete(key)

const delPrefix = (prefix) => {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

const clearAll = () => store.clear()

// Cache-aside helper: serve the cached value or load, cache, and return it.
// Nullish results are never cached, so "not found" never sticks.
const remember = async (key, ttlMs, loader) => {
  const hit = get(key)
  if (hit !== undefined) return hit
  const value = await loader()
  if (value !== undefined && value !== null) set(key, value, ttlMs)
  return value
}

export { TTL_30_SECONDS, TTL_60_SECONDS, get, set, del, delPrefix, clearAll, remember }
