import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import FindFriends from '../../src/pages/FindFriends'

const { authState } = vi.hoisted(() => ({
  authState: { user: { id: 'me' }, isAuthenticated: true },
}))

const mockGet = vi.hoisted(() => vi.fn())

vi.mock('axios', () => ({
  default: { get: mockGet },
}))

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

const users = [
  { id: 'user-9', displayName: 'Ann Lee', school: 'State University', avatarUrl: null, isFollowing: false },
  { id: 'user-10', displayName: 'Ben Cruz', school: null, avatarUrl: null, isFollowing: true },
]

beforeEach(() => {
  mockGet.mockReset()
  mockGet.mockImplementation(() => Promise.resolve({ data: { users } }))
})

describe('FindFriends', () => {
  it('lists existing users on load with a search button', async () => {
    render(<MemoryRouter><FindFriends /></MemoryRouter>)
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
    expect(await screen.findByText('Ann Lee')).toBeInTheDocument()
    expect(screen.getByText('Ben Cruz')).toBeInTheDocument()
    expect(mockGet).toHaveBeenCalledWith(
      '/api/profile/search',
      expect.objectContaining({ params: expect.objectContaining({ q: '' }) })
    )
  })

  it('searches with the entered query when Search is clicked', async () => {
    render(<MemoryRouter><FindFriends /></MemoryRouter>)
    await screen.findByText('Ann Lee')
    fireEvent.change(screen.getByLabelText('Search friends'), { target: { value: 'ann' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith(
      '/api/profile/search',
      expect.objectContaining({ params: expect.objectContaining({ q: 'ann' }) })
    ))
  })

  it('shows a follow action per user', async () => {
    render(<MemoryRouter><FindFriends /></MemoryRouter>)
    await screen.findByText('Ann Lee')
    expect(screen.getAllByRole('button', { name: 'Follow' })).toHaveLength(2)
  })

  it('shows a name-only header without the old subtext', async () => {
    render(<MemoryRouter><FindFriends /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Find Friends', level: 1 })).toBeInTheDocument()
    expect(screen.queryByText('Discover classmates, follow their study guides, and grow your circle.')).not.toBeInTheDocument()
  })
})
