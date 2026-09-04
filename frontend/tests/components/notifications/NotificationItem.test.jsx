import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import NotificationItem from '../../../src/components/notifications/NotificationItem'

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
  it('describes a save notification', () => {
    renderItem({ actionType: 'save' })
    expect(screen.getByText('saved your reviewer')).toBeInTheDocument()
  })

  it('opens the reviewer for save and new reviewer notifications', () => {
    renderItem({ actionType: 'save' })
    expect(screen.getByRole('link', { name: /Ann Lee saved your reviewer/ })).toHaveAttribute('href', '/reviewer/r1')
  })

  it('describes a new reviewer notification with a link', () => {
    renderItem({ actionType: 'new_reviewer' })
    expect(screen.getByText('published a new reviewer')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ann Lee published a new reviewer/ })).toHaveAttribute('href', '/reviewer/r1')
  })

  it('opens the actor profile for follow notifications', () => {
    renderItem({ actionType: 'follow', reviewer: null })
    expect(screen.getByText('started following you')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ann Lee started following you/ })).toHaveAttribute('href', '/profile/user-9')
  })

  it('marks an unread notification as read on click', () => {
    const onMarkRead = vi.fn()
    renderItem({ actionType: 'follow', reviewer: null }, onMarkRead)
    fireEvent.click(screen.getByRole('link', { name: /Ann Lee started following you/ }))
    expect(onMarkRead).toHaveBeenCalledWith('n1')
  })
})
