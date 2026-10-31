import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import Notifications from '../../src/pages/Notifications'
import useQueryCache from '../../src/stores/queryCache'
import useNotificationStore from '../../src/stores/notificationStore'

vi.mock('axios')

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me' }, isAuthenticated: true }),
}))

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me' }, isAuthenticated: true }),
}))

const notification = (id, actionType = 'follow') => ({
  id,
  actor: { displayName: 'Ann Lee', avatarUrl: null },
  actionType,
  reviewer: { id: 'r1', title: 'Calculus' },
  isRead: false,
  createdAt: new Date().toISOString(),
})

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useQueryCache.getState().reset()
    useNotificationStore.getState().setUnreadCount(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('merges newly arrived notifications to the top on window focus', async () => {
    axios.get.mockImplementation((url) => {
      if (String(url).includes('/save')) {
        return Promise.resolve({ data: { saved: false, saveCount: 0 } })
      }
      return Promise.resolve({ data: { notifications: [notification('n1')] } })
    })
    const secondWave = () => axios.get.mockImplementation((url) => {
      if (String(url).includes('/save')) {
        return Promise.resolve({ data: { saved: false, saveCount: 0 } })
      }
      return Promise.resolve({ data: { notifications: [notification('n2', 'new_reviewer'), notification('n1')] } })
    })

    render(<MemoryRouter><Notifications /></MemoryRouter>)
    expect(await screen.findByText('started following you')).toBeInTheDocument()
    expect(screen.queryByText('published a new reviewer')).toBeNull()

    secondWave()
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(await screen.findByText('published a new reviewer')).toBeInTheDocument()
    expect(screen.getAllByText(/Ann Lee/).length).toBeGreaterThanOrEqual(2)
  })

  it('counts notifications that arrive on the first refresh after load', async () => {
    axios.get.mockImplementation(() => Promise.resolve({ data: { notifications: [notification('n1')], total: 1 } }))

    render(<MemoryRouter><Notifications /></MemoryRouter>)
    expect(await screen.findByText('started following you')).toBeInTheDocument()

    axios.get.mockImplementation(() => Promise.resolve({
      data: { notifications: [notification('n2', 'new_reviewer'), notification('n1')], total: 2 },
    }))
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(await screen.findByText('published a new reviewer')).toBeInTheDocument()
    expect(useNotificationStore.getState().unreadCount).toBe(1)
  })

  it('ignores refreshes until the first page has loaded', async () => {
    let resolveFirst
    axios.get.mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
    axios.get.mockImplementation(() => Promise.resolve({ data: { notifications: [notification('n1')], total: 1 } }))

    render(<MemoryRouter><Notifications /></MemoryRouter>)
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })
    await act(async () => {
      resolveFirst({ data: { notifications: [notification('n1')], total: 1 } })
    })

    expect(await screen.findByText('started following you')).toBeInTheDocument()
    expect(useNotificationStore.getState().unreadCount).toBe(0)
    const listCalls = axios.get.mock.calls.filter(([url]) => url === '/api/social/notifications')
    expect(listCalls).toHaveLength(1)
  })

  it('polls for new notifications on a 20 second interval', async () => {
    axios.get.mockImplementation((url) => {
      if (String(url).includes('/save')) {
        return Promise.resolve({ data: { saved: false, saveCount: 0 } })
      }
      return Promise.resolve({ data: { notifications: [notification('n1')] } })
    })
    const setIntervalSpy = vi.spyOn(window, 'setInterval')

    render(<MemoryRouter><Notifications /></MemoryRouter>)
    expect(await screen.findByText('started following you')).toBeInTheDocument()

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 20000)
    setIntervalSpy.mockRestore()
  })

  it('keeps the global unread count instead of replacing it with the page count', async () => {
    useNotificationStore.getState().setUnreadCount(7)
    axios.get.mockImplementation(() => Promise.resolve({
      data: { notifications: [notification('n1')], total: 1 },
    }))

    render(<MemoryRouter><Notifications /></MemoryRouter>)
    expect(await screen.findByText('started following you')).toBeInTheDocument()

    expect(useNotificationStore.getState().unreadCount).toBe(7)
  })

  it('shows Load More when the server reports more than the first page', async () => {
    axios.get.mockImplementation(() => Promise.resolve({
      data: { notifications: [notification('n1')], total: 25 },
    }))

    render(<MemoryRouter><Notifications /></MemoryRouter>)
    expect(await screen.findByText('started following you')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Load More' })).toBeInTheDocument()
  })

  it('uses the supplied follow state instead of fetching it per row', async () => {
    const followNotification = {
      ...notification('n1', 'follow'),
      actor: { id: 'user-2', displayName: 'Ann Lee', avatarUrl: null },
      reviewer: null,
      isFollowing: false,
    }
    axios.get.mockImplementation((url) => {
      if (String(url).includes('/follow')) {
        return Promise.resolve({ data: { following: false, followerCount: 0 } })
      }
      return Promise.resolve({ data: { notifications: [followNotification], total: 1 } })
    })

    render(<MemoryRouter><Notifications /></MemoryRouter>)
    expect(await screen.findByText('started following you')).toBeInTheDocument()

    expect(axios.get).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/social/users/user-2/follow'),
      expect.anything()
    )
  })

  it('uses the supplied save state instead of fetching it per row', async () => {
    const saveNotification = {
      ...notification('n2', 'save'),
      actor: { id: 'user-2', displayName: 'Ann Lee', avatarUrl: null },
      reviewer: { id: 'r1', title: 'Calculus' },
      isSaved: false,
      saveCount: 3,
    }
    axios.get.mockImplementation((url) => {
      if (String(url).includes('/save')) {
        return Promise.resolve({ data: { saved: false, saveCount: 0 } })
      }
      return Promise.resolve({ data: { notifications: [saveNotification], total: 1 } })
    })

    render(<MemoryRouter><Notifications /></MemoryRouter>)
    expect(await screen.findByText('saved your reviewer')).toBeInTheDocument()

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(axios.get).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/social/reviewers/r1/save'),
      expect.anything()
    )
  })
})
