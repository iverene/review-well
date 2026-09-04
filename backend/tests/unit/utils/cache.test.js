import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { get, set, del, delPrefix, clearAll, remember } from '../../../utils/cache.js'

describe('Cache', () => {
  beforeEach(() => {
    clearAll()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    clearAll()
  })

  it('should store and retrieve values', () => {
    set('a', { n: 1 }, 60_000)
    expect(get('a')).toEqual({ n: 1 })
  })

  it('should expire entries after their TTL', () => {
    set('a', 'value', 1_000)
    vi.advanceTimersByTime(999)
    expect(get('a')).toBe('value')
    vi.advanceTimersByTime(1)
    expect(get('a')).toBeUndefined()
  })

  it('should delete single keys and whole namespaces', () => {
    set('reviewers:detail:1', {}, 60_000)
    set('reviewers:public:0:20:', {}, 60_000)
    set('profile:1', {}, 60_000)
    del('reviewers:detail:1')
    expect(get('reviewers:detail:1')).toBeUndefined()
    delPrefix('reviewers:')
    expect(get('reviewers:public:0:20:')).toBeUndefined()
    expect(get('profile:1')).toEqual({})
  })

  it('should load once through remember on repeat calls', async () => {
    const loader = vi.fn().mockResolvedValue({ cached: true })
    await expect(remember('k', 60_000, loader)).resolves.toEqual({ cached: true })
    await expect(remember('k', 60_000, loader)).resolves.toEqual({ cached: true })
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('should never cache nullish results', async () => {
    const loader = vi.fn().mockResolvedValue(null)
    await expect(remember('k', 60_000, loader)).resolves.toBeNull()
    expect(get('k')).toBeUndefined()
    expect(loader).toHaveBeenCalledTimes(1)
    await remember('k', 60_000, loader)
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
