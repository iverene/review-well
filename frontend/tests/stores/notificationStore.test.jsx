import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import useNotificationStore from '../../src/stores/notificationStore'
import NotificationBadge from '../../src/components/notifications/NotificationBadge'
import { useAuth } from '../../src/contexts/AuthContext'

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}))

import axios from 'axios'

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('notificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({ unreadCount: 0 })
  })

  it('decrements but never below zero', () => {
    const { setUnreadCount, markOneRead, markAllRead, bumpUnread } = useNotificationStore.getState()
    setUnreadCount(2)
    markOneRead()
    expect(useNotificationStore.getState().unreadCount).toBe(1)
    markOneRead()
    markOneRead()
    expect(useNotificationStore.getState().unreadCount).toBe(0)
    bumpUnread(3)
    expect(useNotificationStore.getState().unreadCount).toBe(3)
    markAllRead()
    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })
})

describe('NotificationBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useNotificationStore.setState({ unreadCount: 0 })
    useAuth.mockReturnValue({ isAuthenticated: true })
    axios.get.mockResolvedValue({ data: { count: 4 } })
  })

  it('shows the live count and refreshes without a page reload', async () => {
    render(<MemoryRouter><NotificationBadge /></MemoryRouter>)
    expect(await screen.findByText('4')).toBeInTheDocument()
  })

  it('drops instantly when notifications are marked read elsewhere', async () => {
    render(<MemoryRouter><NotificationBadge /></MemoryRouter>)
    expect(await screen.findByText('4')).toBeInTheDocument()
    act(() => {
      useNotificationStore.getState().markAllRead()
    })
    expect(screen.queryByText('4')).toBeNull()
  })
})
