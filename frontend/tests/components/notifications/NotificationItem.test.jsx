import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import NotificationItem from '../../../src/components/notifications/NotificationItem'

const { authState } = vi.hoisted(() => ({
  authState: { user: { id: 'me' }, isAuthenticated: true },
}))

const mockGet = vi.hoisted(() => vi.fn())

vi.mock('axios', () => ({
  default: { get: mockGet, post: vi.fn(), delete: vi.fn() },
}))

vi.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

const baseNotification = {
  id: 'n1',
  actor: { id: 'user-9', displayName: 'Ann Lee', avatarUrl: null },
  reviewer: { id: 'r1', title: 'Calculus' },
  isRead: false,
  createdAt: new Date().toISOString(),
}

const renderItem = (notification, onMarkRead = () => {}) => render(
  <MemoryRouter>
    <NotificationItem notification={{ ...baseNotification, ...notification }} onMarkRead={onMarkRead} />
  </MemoryRouter>
)

describe('NotificationItem', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockGet.mockResolvedValue({ data: { saved: false, saveCount: 0, following: false, followerCount: 0 } })
  })

  it('describes a save notification', () => {
    renderItem({ actionType: 'save' })
    expect(screen.getByText('saved your reviewer')).toBeInTheDocument()
  })

  it('links the reviewer title to the reviewer', () => {
    renderItem({ actionType: 'save' })
    expect(screen.getByRole('link', { name: 'Calculus' })).toHaveAttribute('href', '/reviewer/r1')
  })

  it('links the actor name to their profile', () => {
    renderItem({ actionType: 'save' })
    expect(screen.getByRole('link', { name: 'Ann Lee' })).toHaveAttribute('href', '/profile/user-9')
  })

  it('describes a new reviewer notification', () => {
    renderItem({ actionType: 'new_reviewer' })
    expect(screen.getByText('published a new reviewer')).toBeInTheDocument()
  })

  it('opens the actor profile for follow notifications', () => {
    renderItem({ actionType: 'follow', reviewer: null })
    expect(screen.getByText('started following you')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ann Lee' })).toHaveAttribute('href', '/profile/user-9')
  })

  it('marks an unread notification as read on row click', () => {
    const onMarkRead = vi.fn()
    renderItem({ actionType: 'follow', reviewer: null }, onMarkRead)
    fireEvent.click(screen.getByRole('button', { name: /Ann Lee started following you/ }))
    expect(onMarkRead).toHaveBeenCalledWith('n1')
  })

  it('shows a follow button for follow notifications', () => {
    renderItem({ actionType: 'follow', reviewer: null })
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
  })

  it('shows a save button for save notifications', () => {
    renderItem({ actionType: 'save' })
    expect(screen.getByRole('button', { name: 'Bookmark this reviewer' })).toBeInTheDocument()
  })
})
