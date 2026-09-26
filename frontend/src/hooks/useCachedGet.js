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
    // revalidate (not force): background refresh shares one network call
    // across simultaneous mounts via the dedup map.
    fetchShared(key, () => fetcherRef.current(), { revalidate: true })
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
