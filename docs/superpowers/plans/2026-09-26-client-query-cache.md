# Client Query Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pages render instantly from an in-memory cache on revisit with a quiet background refresh, instead of refetching with a skeleton on every mount.

**Architecture:** A zustand store (`src/stores/queryCache.js`) holds GET responses keyed by method + URL + sorted params; a `useCachedGet` hook (`src/hooks/useCachedGet.js`) serves cached data instantly while revalidating; auth transitions reset the store; pages migrate one by one.

**Tech Stack:** React 18, zustand 4, axios 1.6, vitest + @testing-library/react, eslint.

## Global Constraints

- No new dependencies.
- In-memory cache only; nothing persists to localStorage.
- Notifications list, unread-count, `/api/auth/me`, and the announcement endpoint keep direct axios calls (always-fresh).
- First visit with no cache behaves exactly like today (skeleton, toast on error).
- A failed background refresh never wipes cached data and never shows an error.
- Auth identity change (login as someone else, logout, guest switch) clears the whole cache.
- Follow existing zustand store style (`src/stores/authStore.js`): `create((set, get) => ...)`, default export.
- Test commands run from `C:\Users\Iverene Grace\Projects\review-well\frontend`: `npx vitest run <path>`, `npx eslint <path>`.

---

## File Structure

- Create `frontend/src/stores/queryCache.js` — entries, key builder, shared fetcher with dedup, invalidate, reset.
- Create `frontend/tests/stores/queryCache.test.js` — store unit tests.
- Create `frontend/src/hooks/useCachedGet.js` — hook serving cache-first + revalidate.
- Create `frontend/tests/hooks/useCachedGet.test.jsx` — hook tests incl. remount-instant test.
- Modify `frontend/src/stores/authStore.js` — reset cache on auth identity change.
- Modify `frontend/tests/stores/authStore.test.js` — cover the reset behavior.
- Modify pages: `Home.jsx`, `ReviewerList.jsx`, `Reviewer.jsx`, `Profile.jsx`, `Account.jsx`, `Onboarding.jsx`, `Create.jsx`, `FindFriends.jsx`, `Followers.jsx`, `components/social/FollowButton.jsx`, `components/social/SaveButton.jsx`.

---

### Task 1: Query cache store

**Files:**
- Create: `frontend/src/stores/queryCache.js`
- Test: `frontend/tests/stores/queryCache.test.js`

**Interfaces:**
- Consumes: `zustand` `create`.
- Produces: default export `useQueryCache` (`entries`, `getEntry`, `setEntry`, `invalidate`, `reset`); named exports `cacheKey(method, url, params)`, `fetchShared(key, fetcher, { force })`.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'

import useQueryCache, { cacheKey, fetchShared } from '../../src/stores/queryCache'

describe('Query Cache', () => {
  beforeEach(() => {
    useQueryCache.setState({ entries: {} })
  })

  it('builds stable keys regardless of param order', () => {
    expect(cacheKey('GET', '/api/reviewers/public', { limit: 50, search: 'bio' })).toBe(
      cacheKey('get', '/api/reviewers/public', { search: 'bio', limit: 50 })
    )
  })

  it('returns cached data without calling the fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: { reviewers: [1] } })
    await fetchShared('GET /api/x', fetcher)
    const fetcher2 = vi.fn().mockResolvedValue({ data: { reviewers: [2] } })
    const data = await fetchShared('GET /api/x', fetcher2)
    expect(data).toEqual({ reviewers: [1] })
    expect(fetcher2).not.toHaveBeenCalled()
  })

  it('dedups concurrent same-key requests to one call', async () => {
    let resolve
    const gate = new Promise((r) => { resolve = r })
    const fetcher = vi.fn().mockReturnValue(gate.then(() => ({ data: 'late' })))
    const first = fetchShared('GET /api/y', fetcher)
    const second = fetchShared('GET /api/y', fetcher)
    resolve()
    await expect(first).resolves.toBe('late')
    await expect(second).resolves.toBe('late')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('invalidates by prefix and leaves other keys', async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: 1 })
    await fetchShared('GET /api/reviewers/my', fetcher)
    await fetchShared('GET /api/profile/me', fetcher)
    useQueryCache.getState().invalidate('GET /api/reviewers')
    expect(useQueryCache.getState().getEntry('GET /api/reviewers/my')).toBeNull()
    expect(useQueryCache.getState().getEntry('GET /api/profile/me')).not.toBeNull()
  })

  it('reset clears entries and in-flight dedup', async () => {
    let resolve
    const gate = new Promise((r) => { resolve = r })
    const fetcher = vi.fn().mockReturnValue(gate.then(() => ({ data: 'v1' })))
    const pending = fetchShared('GET /api/z', fetcher)
    useQueryCache.getState().reset()
    resolve()
    await pending
    const fetcher2 = vi.fn().mockResolvedValue({ data: 'v2' })
    await expect(fetchShared('GET /api/z', fetcher2)).resolves.toBe('v2')
    expect(fetcher2).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/stores/queryCache.test.js`
Expected: FAIL with "Failed to resolve import ../../src/stores/queryCache"

- [ ] **Step 3: Write minimal implementation**

```js
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
const inflight = new Map()

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
    try {
      const response = await fetcher()
      useQueryCache.getState().setEntry(key, response.data)
      return response.data
    } finally {
      inflight.delete(key)
    }
  })()
  if (!force) inflight.set(key, promise)
  return promise
}

export default useQueryCache
export { cacheKey, fetchShared }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/stores/queryCache.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Lint the new files**

Run: `npx eslint src/stores/queryCache.js tests/stores/queryCache.test.js`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/stores/queryCache.js frontend/tests/stores/queryCache.test.js
git commit -m "feat: add in-memory query cache store with prefix invalidation"
```

---

### Task 2: useCachedGet hook

**Files:**
- Create: `frontend/src/hooks/useCachedGet.js`
- Test: `frontend/tests/hooks/useCachedGet.test.jsx`

**Interfaces:**
- Consumes: `useQueryCache`, `fetchShared` from `../stores/queryCache` (exact names from Task 1).
- Produces: default export `useCachedGet(key, fetcher, { enabled })` returning `{ data, loading, error, refresh }`.

- [ ] **Step 1: Write the failing test**

```jsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import useQueryCache from '../../src/stores/queryCache'
import useCachedGet from '../../src/hooks/useCachedGet'

const Probe = ({ cacheKey, fetcher, options }) => {
  const { data, loading, error } = useCachedGet(cacheKey, fetcher, options)
  if (loading) return <p>loading</p>
  if (error) return <p>failed</p>
  return <p>got:{JSON.stringify(data)}</p>
}

describe('useCachedGet', () => {
  beforeEach(() => {
    useQueryCache.setState({ entries: {} })
  })

  it('fetches with a skeleton on first load', async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: { hello: 'world' } })
    render(<Probe cacheKey="GET /api/first" fetcher={fetcher} />)
    expect(screen.getByText('loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('got:{"hello":"world"}')).toBeInTheDocument())
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('renders cached content instantly on remount while revalidating', async () => {
    const first = vi.fn().mockResolvedValue({ data: { v: 1 } })
    const { unmount } = render(<Probe cacheKey="GET /api/remount" fetcher={first} />)
    await waitFor(() => expect(screen.getByText('got:{"v":1}')).toBeInTheDocument())
    unmount()
    const second = vi.fn().mockResolvedValue({ data: { v: 2 } })
    render(<Probe cacheKey="GET /api/remount" fetcher={second} />)
    expect(screen.getByText('got:{"v":1}')).toBeInTheDocument()
    expect(screen.queryByText('loading')).toBeNull()
    await waitFor(() => expect(screen.getByText('got:{"v":2}')).toBeInTheDocument())
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('keeps stale content when the background refresh fails', async () => {
    const good = vi.fn().mockResolvedValue({ data: { v: 1 } })
    const { unmount } = render(<Probe cacheKey="GET /api/stale" fetcher={good} />)
    await waitFor(() => expect(screen.getByText('got:{"v":1}')).toBeInTheDocument())
    unmount()
    const bad = vi.fn().mockRejectedValue(new Error('offline'))
    render(<Probe cacheKey="GET /api/stale" fetcher={bad} />)
    expect(screen.getByText('got:{"v":1}')).toBeInTheDocument()
    await waitFor(() => expect(bad).toHaveBeenCalledTimes(1))
    expect(screen.getByText('got:{"v":1}')).toBeInTheDocument()
    expect(screen.queryByText('failed')).toBeNull()
  })

  it('shows failure only when there is nothing cached', async () => {
    const bad = vi.fn().mockRejectedValue(new Error('offline'))
    render(<Probe cacheKey="GET /api/empty-fail" fetcher={bad} />)
    await waitFor(() => expect(screen.getByText('failed')).toBeInTheDocument())
  })

  it('does not fetch when disabled', () => {
    const fetcher = vi.fn()
    render(<Probe cacheKey="GET /api/off" fetcher={fetcher} options={{ enabled: false }} />)
    expect(fetcher).not.toHaveBeenCalled()
    expect(screen.queryByText('loading')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/hooks/useCachedGet.test.jsx`
Expected: FAIL with "Failed to resolve import ../../src/hooks/useCachedGet"

- [ ] **Step 3: Write minimal implementation**

```js
import { useEffect, useRef, useState } from 'react'

import useQueryCache, { fetchShared } from '../stores/queryCache'

// Cache-first GET with quiet revalidation. loading is true only when there
// is nothing cached to show; a background failure keeps stale content and
// reports no error. refresh() forces a network round trip.
const useCachedGet = (key, fetcher, { enabled = true } = {}) => {
  const entry = useQueryCache((state) => (key ? state.entries[key] : undefined))
  const [status, setStatus] = useState(() => {
    const cached = key ? useQueryCache.getState().entries[key] : undefined
    return { loading: !!key && enabled && !cached, error: null }
  })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (!enabled || !key) {
      setStatus({ loading: false, error: null })
      return
    }
    let cancelled = false
    const cached = useQueryCache.getState().entries[key]
    setStatus({ loading: !cached, error: null })
    fetchShared(key, () => fetcherRef.current())
      .then(() => {
        if (!cancelled) setStatus({ loading: false, error: null })
      })
      .catch((fetchError) => {
        if (cancelled) return
        const hasCache = !!useQueryCache.getState().entries[key]
        setStatus({ loading: false, error: hasCache ? null : fetchError })
      })
    return () => {
      cancelled = true
    }
  }, [key, enabled])

  return {
    data: entry?.data ?? null,
    loading: status.loading,
    error: status.error,
    refresh: () => fetchShared(key, fetcher, { force: true }),
  }
}

export default useCachedGet
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/hooks/useCachedGet.test.jsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Lint the new files**

Run: `npx eslint src/hooks/useCachedGet.js tests/hooks/useCachedGet.test.jsx`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/useCachedGet.js frontend/tests/hooks/useCachedGet.test.jsx
git commit -m "feat: add useCachedGet hook with quiet revalidation"
```

---

### Task 3: Reset cache on auth identity change

**Files:**
- Modify: `frontend/src/stores/authStore.js`
- Test: `frontend/tests/stores/authStore.test.js`

**Interfaces:**
- Consumes: `useQueryCache` default export (`.getState().reset()`, `.getState().setEntry()`) from `./queryCache`.
- Produces: unchanged authStore API; reset happens inside `login`, `logout`, `enterGuest`.

- [ ] **Step 1: Write the failing tests.** Append to the `describe('Auth Store')` block in `frontend/tests/stores/authStore.test.js`:

```js
it('clears the query cache when a different user logs in', () => {
  useQueryCache.getState().setEntry('GET /api/reviewers/my', [])
  useQueryCache.getState().setEntry('GET /api/profile/me', {})
  useAuthStore.getState().login({ id: 'user-123' })
  expect(useQueryCache.getState().getEntry('GET /api/reviewers/my')).toBeNull()
  expect(useQueryCache.getState().getEntry('GET /api/profile/me')).toBeNull()
})

it('keeps the query cache when the same user session refreshes', () => {
  useAuthStore.getState().login({ id: 'user-123' })
  useQueryCache.getState().setEntry('GET /api/reviewers/my', [])
  useAuthStore.getState().login({ id: 'user-123' })
  expect(useQueryCache.getState().getEntry('GET /api/reviewers/my')).not.toBeNull()
})

it('clears the query cache on logout and guest switch', () => {
  useAuthStore.getState().login({ id: 'user-123' })
  useQueryCache.getState().setEntry('GET /api/reviewers/my', [])
  useAuthStore.getState().logout()
  expect(useQueryCache.getState().getEntry('GET /api/reviewers/my')).toBeNull()
  useQueryCache.getState().setEntry('GET /api/reviewers/my', [])
  useAuthStore.getState().enterGuest()
  expect(useQueryCache.getState().getEntry('GET /api/reviewers/my')).toBeNull()
})
```

Add the import at the top of the test file:

```js
import useQueryCache from '../../src/stores/queryCache'
```

Also reset the cache in that file's `beforeEach`:

```js
useQueryCache.setState({ entries: {} })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/stores/authStore.test.js`
Expected: FAIL (cache entries survive login/logout because nothing resets them)

- [ ] **Step 3: Write minimal implementation.** Edit `frontend/src/stores/authStore.js`:

```js
import { create } from 'zustand'

import useQueryCache from './queryCache'
```

Replace the three actions:

```js
login: (user) => {
  writeGuestSession(false)
  const previous = useAuthStore.getState()
  if (!previous.isAuthenticated || previous.user?.id !== user?.id) {
    useQueryCache.getState().reset()
  }
  set({ user, isAuthenticated: true, isGuest: false })
},
```

```js
enterGuest: () => {
  writeGuestSession(true)
  const previous = useAuthStore.getState()
  if (previous.isAuthenticated || previous.user) {
    useQueryCache.getState().reset()
  }
  set({ user: null, isAuthenticated: false, isGuest: true })
},
```

```js
logout: () => {
  writeGuestSession(false)
  useQueryCache.getState().reset()
  set({ user: null, isAuthenticated: false, isGuest: false })
},
```

(`useAuthStore` is referenced inside its own creator closures, which run after assignment — the same pattern `AnnouncementModal.jsx` uses with `useAuthStore.getState()`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/stores/authStore.test.js tests/stores/queryCache.test.js tests/hooks/useCachedGet.test.jsx`
Expected: PASS (all files)

- [ ] **Step 5: Lint**

Run: `npx eslint src/stores/authStore.js tests/stores/authStore.test.js`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/stores/authStore.js frontend/tests/stores/authStore.test.js
git commit -m "feat: reset query cache on auth identity change"
```

---

### Task 4: Migrate list pages (Home, ReviewerList) + Create mutations

**Files:**
- Modify: `frontend/src/pages/Home.jsx`, `frontend/src/pages/ReviewerList.jsx`, `frontend/src/pages/Create.jsx`

**Interfaces:**
- Consumes: `useCachedGet` default export, `cacheKey` and `useQueryCache` (for `invalidate`) from `../stores/queryCache`.

**Home.jsx** — replace the single `loadReviewers` effect (lines 82-129) with three cached hooks plus a rail-sync effect. Replace lines 82-129 with:

```jsx
const publicKey = cacheKey('GET', '/api/reviewers/public', { limit: 50 })
const {
  data: publicData,
  loading: publicLoading,
  error: publicError,
} = useCachedGet(publicKey, () => axios.get('/api/reviewers/public', { params: { limit: 50 } }), {
  enabled: isAuthenticated || isGuest,
})

const myKey = 'GET /api/reviewers/my'
const { data: myData } = useCachedGet(myKey, () => axios.get('/api/reviewers/my', { withCredentials: true }), {
  enabled: !!isAuthenticated && !!user?.id,
})

const storedRail = (() => {
  if (!isAuthenticated || !user?.id) return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentReviewersKey(user.id)) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})()
const railIds = [...new Set(storedRail.map((entry) => entry?.id).filter(Boolean))]
const existsKey = railIds.length > 0 ? cacheKey('GET', '/api/reviewers/exists', { ids: railIds.join(',') }) : null
const { data: existsData } = useCachedGet(
  existsKey,
  () =>
    axios.get('/api/reviewers/exists', {
      params: { ids: railIds.join(',') },
      withCredentials: true,
    }),
  { enabled: !!existsKey }
)

useEffect(() => {
  setPublicReviewers(publicData?.reviewers || [])
}, [publicData])

useEffect(() => {
  if (!isAuthenticated) return
  setMyReviewers(myData?.reviewers || [])
}, [myData, isAuthenticated])

useEffect(() => {
  if (!isAuthenticated || !user?.id) return
  if (storedRail.length === 0) {
    setRecentReviewers([])
    return
  }
  if (!existsData) return
  // Server-side validation: evict deleted (or now-private) entries so
  // ghosts never render — localStorage is per-browser and goes stale
  // across devices after deletes.
  const valid = new Set(existsData.ids || [])
  const pruned = storedRail.filter((entry) => valid.has(entry?.id))
  try {
    window.localStorage.setItem(recentReviewersKey(user.id), JSON.stringify(pruned))
  } catch {
    // Corrupt rail — keep the in-memory list and try again next visit.
  }
  setRecentReviewers(pruned)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [existsData, isAuthenticated, user?.id])

useEffect(() => {
  setLoading(publicLoading)
}, [publicLoading])

useEffect(() => {
  if (publicError && publicReviewers.length === 0) {
    toast.error(getApiErrorMessage(publicError, 'Unable to load reviewers right now.'))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [publicError])
```

Notes for the implementer: `setLoading(true)` at fetch start is replaced by the hook's `loading` (true only with nothing cached). The `storedRail`/`railIds` computation runs every render but is cheap and localStorage-backed; the exists request is cached per id-set. The guest/landing early return at line 131 stays unchanged. Add imports: `useCachedGet` from `../hooks/useCachedGet`, `cacheKey` from `../stores/queryCache`.

**ReviewerList.jsx** — replace the `loadReviewers` effect (lines 31-53) with:

```jsx
const listParams = mine
  ? {}
  : {
      limit: 50,
      ...(debouncedQuery ? { search: debouncedQuery } : {}),
      ...(filters.examType ? { examType: filters.examType } : {}),
      ...(filters.semester ? { semester: filters.semester } : {}),
    }
const listKey = mine ? 'GET /api/reviewers/my' : cacheKey('GET', '/api/reviewers/public', listParams)
const {
  data: listData,
  loading: listLoading,
  error: listError,
} = useCachedGet(
  listKey,
  () =>
    axios.get(mine ? '/api/reviewers/my' : '/api/reviewers/public', {
      params: listParams,
      withCredentials: mine,
    }),
  { enabled: mine ? !!user?.id : true }
)

useEffect(() => {
  const loadedReviewers = listData?.reviewers || []
  setReviewers(sameCourseOnly ? loadedReviewers.filter((reviewer) => isSameCourse(reviewer, user)) : loadedReviewers)
  setLoading(listLoading)
}, [listData, listLoading, sameCourseOnly, user])

useEffect(() => {
  if (listError && reviewers.length === 0) {
    toast.error(getApiErrorMessage(listError, 'Unable to load reviewers.'))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [listError])
```

Remove the old `loadReviewers` effect entirely. Keep the debounce effect, search form, and Filter UI unchanged. Add imports for `useCachedGet` and `cacheKey`.

**Create.jsx** — after each successful reviewer mutation, invalidate the list/detail keys. There are four sites (lines 123, 147, 151, 174, 186 raise to five): after `await axios.post('/api/reviewer-files', ...)` (line 123), after `await axios.put(...)` (lines 147, 151), after `await axios.post('/api/reviewers', ...)` (line 174), and after `await axios.delete(...)` (line 186), insert:

```js
useQueryCache.getState().invalidate('GET /api/reviewers')
```

with import `useQueryCache from '../stores/queryCache'` at the top. The detail key `GET /api/reviewers/${id}` starts with that prefix, so edit-mode and detail entries refresh too.

- [ ] **Step 1: Migrate Home.jsx** as specified above
- [ ] **Step 2: Migrate ReviewerList.jsx** as specified above
- [ ] **Step 3: Add the five `invalidate` calls in Create.jsx** as specified above
- [ ] **Step 4: Run page tests**

Run: `npx vitest run tests/pages/Home.test.jsx tests/pages/ReviewerList.test.jsx tests/pages/Create.test.jsx`
(If a page test file does not exist under that exact name, run the matching tests found via `npx vitest run tests/pages -t` with the page name, or the full `tests/pages` directory.)
Expected: PASS — first-load behavior is unchanged, so existing assertions hold

- [ ] **Step 5: Lint**

Run: `npx eslint src/pages/Home.jsx src/pages/ReviewerList.jsx src/pages/Create.jsx`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Home.jsx frontend/src/pages/ReviewerList.jsx frontend/src/pages/Create.jsx
git commit -m "feat: serve home and reviewer lists from query cache"
```

---

### Task 5: Migrate detail and secondary pages

**Files:**
- Modify: `frontend/src/pages/Reviewer.jsx`, `frontend/src/pages/Profile.jsx`, `frontend/src/pages/Account.jsx`, `frontend/src/pages/Onboarding.jsx`, `frontend/src/pages/FindFriends.jsx`, `frontend/src/pages/Followers.jsx`, `frontend/src/components/social/FollowButton.jsx`, `frontend/src/components/social/SaveButton.jsx`

**Reviewer.jsx** — replace `loadReviewer` + its effect (lines 74-108) with:

```jsx
const detailKey = `GET /api/reviewers/${id}`
const {
  data: detailData,
  loading: detailLoading,
  error: detailError,
} = useCachedGet(detailKey, () => axios.get(`/api/reviewers/${id}`, { withCredentials: true }), {
  enabled: !!id,
})

useEffect(() => {
  setLoading(detailLoading)
}, [detailLoading])

useEffect(() => {
  const loadedReviewer = detailData?.reviewer
  if (!loadedReviewer) return
  setReviewer(loadedReviewer)
  setCards(Array.isArray(loadedReviewer.cards) ? loadedReviewer.cards : [])
  if (isAuthenticated && user?.id) {
    // Storage must never fail the page: corrupt entries fall back to a
    // fresh rail instead of pushing the loaded reviewer into onError.
    try {
      const key = recentReviewersKey(user.id)
      const parsed = JSON.parse(window.localStorage.getItem(key) || '[]')
      const recent = Array.isArray(parsed) ? parsed : []
      const withoutCurrent = recent.filter((item) => item?.id !== loadedReviewer.id)
      window.localStorage.setItem(key, JSON.stringify([loadedReviewer, ...withoutCurrent].slice(0, 5)))
    } catch {
      // Corrupt rail — leave storage alone and keep the loaded reviewer.
    }
  }
}, [detailData, isAuthenticated, user?.id])

useEffect(() => {
  if (!detailError) {
    setError(null)
    return
  }
  // A ghost entry (deleted since it was listed or saved) heals itself:
  // evict it from Recently Viewed on every surface.
  if (detailError.response?.status === 404) purgeRecentReviewer(id)
  setError(getApiErrorMessage(detailError, 'Unable to load this reviewer.'))
}, [detailError, id])
```

Delete the old `loadReviewer` function and its calling effect. Then add invalidation to mutations: in `handleVisibilityChange` (line 125) after `setReviewer(...)` add `useQueryCache.getState().invalidate('GET /api/reviewers')`; in `handleDeleteReviewer` (line 142) after `purgeRecentReviewer(id)` add the same invalidate; after each cards/blurting/AI mutation success (lines 181, 196, 210, 225, 252, 268, 274) add `useQueryCache.getState().invalidate(detailKey)`. Add imports for `useCachedGet` and `useQueryCache`.

**Profile.jsx** — keep the `fetchProfile`/`fetchLists` structure (the lists depend on the loaded profile id) but serve through the store. Replace the `axios.get` in `fetchProfile` (line 153) with:

```js
const url = userId ? `/api/profile/${userId}` : '/api/profile/me'
const response = await fetchShared(`GET ${url}`, () => axios.get(url, { withCredentials: true }), { force: silent })
```

with `silent` forcing a network round trip for the follow-toggle refresh. Replace the `Promise.all` array (lines 175-180) with:

```js
const [reviewersRes, savedRes] = await Promise.all([
  fetchShared(`GET ${reviewersUrl}`, () => axios.get(reviewersUrl, { withCredentials: true }), { force: silent }),
  own
    ? fetchShared('GET /api/social/saved', () => axios.get('/api/social/saved', { withCredentials: true }), { force: silent })
    : Promise.resolve({ data: { reviewers: [] } }),
])
```

`fetchShared` resolves with `response.data`, so change `response.data.user` to `response.user`, `reviewersRes.data.reviewers` to `reviewersRes.reviewers`, and `savedRes.data.reviewers` to `savedRes.reviewers` in the lines that follow. Thread `silent` through: `fetchProfile` already takes it; add a `silent = false` parameter to `fetchLists` and pass it from the mount effect as `fetchLists(loaded, false)`. In `handleFollowToggle`, after the follow mutation, call `fetchProfile(true)` (already silent) — no change needed beyond the above. Add `import { fetchShared } from '../stores/queryCache'`. Leave the parked `FocusStats` block (lines 20-59, `SHOW_FOCUS_STATS = false`) untouched.

**Account.jsx** — replace `fetchProfile` (lines 29-39) with:

```js
const { data: profileData, loading: profileLoading, error: profileError } = useCachedGet(
  'GET /api/profile/me',
  () => axios.get('/api/profile/me', { withCredentials: true })
)

useEffect(() => {
  setProfile(profileData?.user || null)
  setLoading(profileLoading)
}, [profileData, profileLoading])

useEffect(() => {
  if (profileError) setError(getApiErrorMessage(profileError, 'Unable to load your profile.'))
}, [profileError])
```

Remove the old `fetchProfile` function and its calling effect (lines 25-27). In `handleSave` after `setProfile(response.data.user)` add `useQueryCache.getState().invalidate('GET /api/profile/me')`; in `handleAvatarUpload` after the successful PUT add the same invalidate. Add imports for `useCachedGet` and `useQueryCache`. (`refreshUser()` calls stay — the auth check is excluded from caching.)

**Onboarding.jsx** — after the successful `await axios.put('/api/profile/me', formData, ...)` (line 65) add `useQueryCache.getState().invalidate('GET /api/profile/me')` with the `useQueryCache` import.

**FindFriends.jsx** — replace the `axios.get` in `search` (line 22) with:

```js
const key = cacheKey('GET', '/api/profile/search', { q: term, limit: 20 })
const response = { data: await fetchShared(key, () => axios.get('/api/profile/search', {
  params: { q: term, limit: 20 },
  withCredentials: true,
})) }
```

keeping the surrounding `setUsers(response.data.users || [])`, `setSearched(true)`, loading, and toast logic exactly as-is. Add imports for `fetchShared` and `cacheKey`.

**Followers.jsx** — replace the `axios.get` in `load` (line 24) with:

```js
const key = `GET /api/social/users/${userId}/${type}`
const listData = await fetchShared(key, () => axios.get(`/api/social/users/${userId}/${type}`, { withCredentials: true }))
setUsers(listData.users || [])
```

keeping loading/toast logic. Add the `fetchShared` import.

**FollowButton.jsx** — after a successful follow/unfollow (lines 47-50), add `useQueryCache.getState().invalidate('GET /api/social/users/')` and `useQueryCache.getState().invalidate('GET /api/profile/')` with the import. The button's own state-check GET (line 23) stays a direct axios call.

**SaveButton.jsx** — after a successful save/unsave (lines 45, 52), add `useQueryCache.getState().invalidate('GET /api/social/saved')` and `useQueryCache.getState().invalidate('GET /api/reviewers')` with the import. The button's own state-check GET (line 21) stays a direct axios call.

- [ ] **Step 1: Migrate Reviewer.jsx** (detail hook + rail effects + 9 invalidate calls)
- [ ] **Step 2: Migrate Profile.jsx** (fetchShared in fetchProfile/fetchLists + `.data` unwrap fixes)
- [ ] **Step 3: Migrate Account.jsx and Onboarding.jsx**
- [ ] **Step 4: Migrate FindFriends.jsx, Followers.jsx, Create.jsx edit-mode GET** — replace Create.jsx line 64 `await axios.get(...)` with `const response = { data: await fetchShared(`GET /api/reviewers/${editReviewerId}`, () => axios.get(`/api/reviewers/${editReviewerId}`, { withCredentials: true })) }`, keeping the cancelled-guard and form-population logic
- [ ] **Step 5: Add FollowButton/SaveButton invalidations**
- [ ] **Step 6: Run page and component tests**

Run: `npx vitest run tests/pages tests/components`
Expected: PASS

- [ ] **Step 7: Lint**

Run: `npx eslint src/pages/Reviewer.jsx src/pages/Profile.jsx src/pages/Account.jsx src/pages/Onboarding.jsx src/pages/FindFriends.jsx src/pages/Followers.jsx src/pages/Create.jsx src/components/social/FollowButton.jsx src/components/social/SaveButton.jsx`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/Reviewer.jsx frontend/src/pages/Profile.jsx frontend/src/pages/Account.jsx frontend/src/pages/Onboarding.jsx frontend/src/pages/FindFriends.jsx frontend/src/pages/Followers.jsx frontend/src/pages/Create.jsx frontend/src/components/social/FollowButton.jsx frontend/src/components/social/SaveButton.jsx
git commit -m "feat: serve detail and secondary pages from query cache"
```

---

### Task 6: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full frontend suite**

Run: `npx vitest run --pool=forks --maxWorkers=2 --minWorkers=2`
Expected: all files pass (baseline before this plan: 30 files / 145 tests)

- [ ] **Step 2: Run full lint**

Run: `npx eslint src --ext .js,.jsx`
Expected: no new errors (pre-existing warnings, if any, unchanged — confirm with `git stash` + rerun only if something looks caused by this plan)

- [ ] **Step 3: Manual smoke pass in the browser**

1. Load Public Reviewers, open a reviewer, go back — list appears instantly, no skeleton.
2. Create a reviewer — My Reviewers refetches on next visit.
3. Edit your profile — Profile page shows the change.
4. Log out and log in as a different user (or guest) — no data from the previous identity.
5. Notifications page and badge counts still fetch fresh every time.

---

## Self-Review

- **Spec coverage:** instant revisit + background refresh (Tasks 1, 2, 4, 5); exclusions honored (Task 5 leaves Notifications/store/auth/announcement/vapid untouched; Task 6 verifies); mutation invalidation (Tasks 4, 5); auth reset (Task 3); silent background errors + first-load behavior (Task 2 hook contract); tests (Tasks 1-3 unit, Task 2 remount test, Tasks 4-6 existing suites).
- **Placeholder scan:** every step names exact files, exact code, and exact commands. No TBD/TODO. The one conditional (page test filenames in Task 4 Step 4) gives the fallback command.
- **Type consistency:** `cacheKey(method, url, params)` and `fetchShared(key, fetcher, { force })` are defined once in Task 1 and referenced by identical names in Tasks 2-5. Key format `METHOD url?sorted` is used uniformly, including the `GET /api/reviewers/${id}` prefix relationship relied upon for invalidation.
