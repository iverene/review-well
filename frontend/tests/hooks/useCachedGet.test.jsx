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
