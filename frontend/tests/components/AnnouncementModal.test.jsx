import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import AnnouncementModal, { STORAGE_KEY, ANNOUNCEMENT_ID } from '../../src/components/AnnouncementModal'
import { useAuth } from '../../src/contexts/AuthContext'
import useAuthStore from '../../src/stores/authStore'

vi.mock('axios', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}))

import axios from 'axios'

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('AnnouncementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    useAuth.mockReturnValue({ user: null, isAuthenticated: false })
    axios.get.mockResolvedValue({ data: { announcementSeenId: null } })
    axios.put.mockResolvedValue({ data: { announcementSeenId: ANNOUNCEMENT_ID } })
  })

  it('announces new updates with coming-soon intact on first visit', () => {
    render(<AnnouncementModal />)
    expect(screen.getByRole('dialog', { name: 'What’s New in Review Well' })).toBeInTheDocument()
    expect(screen.getByText('Search and filters on public reviewers')).toBeInTheDocument()
    expect(screen.getByText('AI Flashcards')).toBeInTheDocument()
    expect(screen.getByText('Pomodoro Technique')).toBeInTheDocument()
    expect(screen.getByText('Blurting')).toBeInTheDocument()
  })

  it('never shows again after closing', () => {
    render(<AnnouncementModal />)
    fireEvent.click(screen.getByRole('button', { name: 'Got It' }))
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dismissed')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('stays hidden when already dismissed in this browser', () => {
    window.localStorage.setItem(STORAGE_KEY, 'dismissed')
    render(<AnnouncementModal />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows again for a new announcement id', () => {
    window.localStorage.setItem('review-well-announcement-v1', 'dismissed')
    render(<AnnouncementModal />)
    expect(screen.getByRole('dialog', { name: 'What’s New in Review Well' })).toBeInTheDocument()
  })

  it('hides for signed-in users who dismissed it on another browser', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' }, isAuthenticated: true })
    axios.get.mockResolvedValue({ data: { announcementSeenId: ANNOUNCEMENT_ID } })
    render(<AnnouncementModal />)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(axios.get).toHaveBeenCalledWith('/api/profile/me/announcement', { withCredentials: true })
  })

  it('syncs dismissal to the server for signed-in users', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' }, isAuthenticated: true })
    useAuthStore.setState({ user: { id: 'u1' }, isAuthenticated: true, isGuest: false })
    render(<AnnouncementModal />)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Got It' }))
    await waitFor(() => expect(axios.put).toHaveBeenCalledWith(
      '/api/profile/me/announcement',
      { announcementId: ANNOUNCEMENT_ID },
      { withCredentials: true }
    ))
    expect(useAuthStore.getState().user?.announcementSeenId).toBe(ANNOUNCEMENT_ID)
  })
})
