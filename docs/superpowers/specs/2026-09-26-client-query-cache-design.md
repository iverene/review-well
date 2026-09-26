# Client Query Cache Design

Date: 2026-09-26
Status: Approved (all sections)

## Problem

Every page fetches with raw `axios.get` in `useEffect` on mount and keeps
results in local `useState`. Navigating away unmounts the page, discards the
data, and navigating back refetches with a loading skeleton. The app feels
like it reloads on every page.

## Goal

Open a page the first time: load and fetch as today. Open it again without
exiting the browser: content is there instantly, no reload flash, with a
quiet background refresh keeping it fresh (stale-while-revalidate).

## Non-goals

- Persisting cache across browser restarts (in-memory only by design).
- Restoring scroll position or search/filter text across navigation.
- Changing notifications, unread badges, or the auth check (stay always-fresh).

## Architecture

One new zustand store, `useQueryCache`, mirroring the existing `authStore` /
`notificationStore` style. Entries keyed by `method + url + sorted params`
(e.g. `GET /api/reviewers/public?limit=50`), each holding
`{ data, fetchedAt }`. In-memory only: closing the browser clears it with no
persistence code. A single `invalidate(prefix)` wipes matching keys, mirroring
the backend cache's `delPrefix` convention. Pages keep their local state and
skeletons; they read through the cache instead of calling axios directly.

## Components and Data Flow

One new hook, `useCachedGet(key, fetcher)`, used inside each page's existing
`useEffect` in place of the raw `axios.get`:

- Cache hit: render stored data immediately (no skeleton), fire the fetcher
  quietly in the background; any successful background response replaces the
  entry (identical content rerenders harmlessly, changed content updates).
- Cache miss: identical to today (skeleton, fetch, render, store).
- In-flight dedup: simultaneous requests for the same key share one network
  call.
- Mutations invalidate: after create/edit/delete/publish, callers invoke
  `invalidate('/api/reviewers')` (prefix match) so the next visit refetches.
- Excluded from caching: notifications list, unread-count, `/api/auth/me`.

## Error Handling

- First visit with no cache: today's behavior unchanged (skeleton, toast,
  error/empty state on failure).
- Background revalidation failure: silent. Stale content stays up, the error
  is console-logged, the next mount retries. A failed quiet refresh never
  wipes cached data or flashes an error.
- Auth change (login, logout, guest switch) clears the entire store so one
  user never sees another's data.

## Testing

- Store unit tests: hit returns data without fetching; miss fetches and
  stores; prefix invalidation wipes the right keys only; concurrent same-key
  requests dedup to one call.
- One component test: a remounted page renders cached content instantly while
  revalidating.
- All existing page tests keep passing with unchanged behavior.

## Rollout

Migrate pages to `useCachedGet` incrementally (lists first: Home, My/Public
Reviewers), then detail and secondary pages. Each migrated page keeps its
current first-load UX.
