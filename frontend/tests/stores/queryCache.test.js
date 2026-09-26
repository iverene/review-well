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

  it('revalidates through the network while deduping concurrent refreshes', async () => {
    const first = vi.fn().mockResolvedValue({ data: 'v1' })
    await fetchShared('GET /api/r', first)
    let resolveGate
    const gate = new Promise((resolve) => { resolveGate = resolve })
    const second = vi.fn().mockReturnValue(gate.then(() => ({ data: 'v2' })))
    const a = fetchShared('GET /api/r', second, { revalidate: true })
    const b = fetchShared('GET /api/r', second, { revalidate: true })
    resolveGate()
    await expect(a).resolves.toBe('v2')
    await expect(b).resolves.toBe('v2')
    expect(second).toHaveBeenCalledTimes(1)
    expect(useQueryCache.getState().getEntry('GET /api/r')).toMatchObject({ data: 'v2' })
  })
})
